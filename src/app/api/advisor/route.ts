// /app/api/advisor/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

interface RequestBody {
    message: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000/",
        "X-Title": "TuVanDatPhongResort-LuanVan",
    },
});

const formatCurrency = (amount: number): string =>
    amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// Hàm xử lý số tiền được cải thiện
const parseMoneyFromText = (text: string): number => {
    const lowerText = text.toLowerCase();
    
    // Tìm pattern số + đơn vị (triệu, tr, k, nghìn)
    const patterns = [
        /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/i,  // 2 triệu, 2.5 triệu
        /(\d+(?:[.,]\d+)?)\s*(?:nghìn|k)/i,   // 500 nghìn, 500k
        /(\d+(?:[.,]\d+)?)\s*(?:đồng)?$/i,    // số thuần không có đơn vị
    ];
    
    for (const pattern of patterns) {
        const match = lowerText.match(pattern);
        if (match) {
            const number = parseFloat(match[1].replace(',', '.'));
            if (pattern.source.includes('triệu|tr')) {
                return number * 1000000;
            } else if (pattern.source.includes('nghìn|k')) {
                return number * 1000;
            } else {
                // Nếu số lớn hơn 1000 thì coi như đã là VND
                return number > 1000 ? number : number * 1000000;
            }
        }
    }
    
    return 0;
};

// Hàm parse số ngày/đêm
const parseNightsFromText = (text: string): number => {
    const nightsPatterns = [
        /(\d+)\s*(?:đêm|dem)/i,
        /(\d+)\s*(?:ngày|day)/i,
        /ở\s*(\d+)/i,
    ];
    
    for (const pattern of nightsPatterns) {
        const match = text.match(pattern);
        if (match) {
            return parseInt(match[1]);
        }
    }
    
    return 1; // Mặc định 1 đêm
};

// Hàm parse số người
const parsePeopleFromText = (text: string): number => {
    const lowerText = text.toLowerCase();
    
    const peoplePatterns = [
        /(\d+)\s*(?:người|ng)/i,
        /cho\s*(\d+)/i, // "cho 2 người"
        /(\d+)\s*(?:khách|guest)/i,
        /cặp\s*đôi/i, // trả về 2 nếu là "cặp đôi"
        /gia\s*đình\s*(\d+)/i, // "gia đình 4 người"
    ];
    
    // Kiểm tra "cặp đôi" trước
    if (lowerText.includes('cặp đôi') || lowerText.includes('couple')) {
        return 2;
    }
    
    for (const pattern of peoplePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return parseInt(match[1]);
        }
    }
    
    return 2; // Mặc định 2 người (thường là cặp đôi đi resort)
};

// Hàm tìm dịch vụ được đề cập
const findMentionedServices = async (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Lấy tất cả dịch vụ từ database
    const allServices = await prisma.dichvu.findMany({
        select: {
            maDV: true,
            tenDV: true,
            giaDV: true,
           
        },
    });
    
    const mentionedServices = [];
    
    // Kiểm tra từng dịch vụ xem có được đề cập không
    for (const service of allServices) {
        const serviceName = service.tenDV.toLowerCase();
        const keywords = serviceName.split(' ');
        
        // Kiểm tra nếu tên dịch vụ hoặc từ khóa xuất hiện trong tin nhắn
        if (lowerText.includes(serviceName) || 
            keywords.some(keyword => lowerText.includes(keyword))) {
            mentionedServices.push(service);
        }
    }
    
    // Kiểm tra một số từ khóa phổ biến
    const serviceKeywords = {
        'spa': ['spa', 'massage', 'mát xa'],
        'ăn': ['ăn', 'đồ ăn', 'thức ăn', 'bữa ăn', 'món ăn'],
        'uống': ['uống', 'đồ uống', 'nước uống', 'cocktail', 'bar'],
        'gym': ['gym', 'thể dục', 'fitness'],
        'pool': ['pool', 'bể bơi', 'hồ bơi'],
        'tour': ['tour', 'tham quan', 'du lịch'],
    };
    
    for (const [category, keywords] of Object.entries(serviceKeywords)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            // Tìm dịch vụ có tên chứa category này
            const matchingServices = allServices.filter(service => 
                service.tenDV.toLowerCase().includes(category) ||
                keywords.some(keyword => service.tenDV.toLowerCase().includes(keyword))
            );
            mentionedServices.push(...matchingServices);
        }
    }
    
    // Loại bỏ trùng lặp
    const uniqueServices = mentionedServices.filter((service, index, self) => 
        index === self.findIndex(s => s.maDV === service.maDV)
    );
    
    return uniqueServices;
};

const extractIntent = async (message: string) => {
    const normalizedMessage = message.toLowerCase();

    // Cải thiện pattern để bắt các trường hợp phức tạp hơn
    const affordableRoomPatterns = [
        /ph\u00f2ng.*(d\u01b0\u1edbi|\u0111\u01b0\u1edbi|t\u1ed1i \u0111a|kho\u1ea3ng|<=?)\s*\d+/i,
        /c\u00f3.*ph\u00f2ng.*nào.*(d\u01b0\u1edbi|\u0111\u01b0\u1edbi)/i,
        /ph\u00f2ng.*gi\u00e1.*(d\u01b0\u1edbi|\u0111\u01b0\u1edbi|t\u1ed1i \u0111a)/i,
        /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|nghìn|k).*(?:\u0111\u00eam|đêm|ngày)/i,
        /c\u00f3.*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|nghìn|k)/i, // "có 5 triệu"
        /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|nghìn|k).*(?:ở|cho)/i, // "5 triệu ở 2 ngày"
    ];

    for (const pattern of affordableRoomPatterns) {
        if (pattern.test(normalizedMessage)) {
            return { intent: "ask_affordable_rooms_with_services" };
        }
    }

    const intentPrompt = `Phân tích tin nhắn sau và xác định ý định của người dùng:
Tin nhắn: "${message}"

Trả về JSON với trường:
- intent: string (ví dụ: "check_service", "ask_price", "general","ask_voucher","check_discount","ask_room_types","ask_affordable_rooms","ask_affordable_rooms_with_services")

Nếu tin nhắn có đề cập đến ngân sách + thời gian + dịch vụ thì trả về "ask_affordable_rooms_with_services"
Nếu không rõ ý định, trả về "general".
Ví dụ: { "intent": "check_service" }`;

    const response = await openai.chat.completions.create({
        model: "mistralai/mistral-7b-instruct",
        messages: [
            { role: "system", content: "Bạn là trợ lý resort, hãy trả lời bằng JSON." },
            { role: "user", content: intentPrompt },
        ],
        response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return { intent: result.intent || "general" };
};

export async function POST(req: Request) {
    try {
        const { message }: RequestBody = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Vui lòng cung cấp tin nhắn" }, { status: 400 });
        }

        const { intent } = await extractIntent(message);

        if (intent === "ask_voucher") {
            const vouchers = await prisma.voucher.findMany({
                where: {
                    trangThai: "ConHieuLuc",
                    ngayBatDau: { lte: new Date() },
                    ngayKetThuc: { gte: new Date() },
                },
                select: {
                    tenVoucher: true,
                    moTa: true,
                    phanTramGiam: true,
                    dieuKienApDung: true,
                    ngayKetThuc: true,
                },
            });

            const reply = vouchers.length
                ? vouchers.map((v) => {
                      const dieuKien = v.dieuKienApDung
                          ? ` (áp dụng cho đơn từ ${formatCurrency(Number(v.dieuKienApDung))})`
                          : "";
                      return `🎁 ${v.tenVoucher}: Giảm ${v.phanTramGiam}%${dieuKien}. Hết hạn: ${v.ngayKetThuc.toLocaleDateString("vi-VN")}`;
                  }).join("\n")
                : "Hiện tại không có chương trình khuyến mãi nào đang áp dụng.";

            return NextResponse.json({ reply });
        }

        if (intent === "ask_room_types") {
            const roomTypes = await prisma.loaiphong.findMany({
                select: {
                    tenLoaiPhong: true,
                    soNguoi: true,
                },
            });

            const reply = roomTypes.length
                ? roomTypes.map((r) => `🏨 ${r.tenLoaiPhong}: Dành cho ${r.soNguoi} người.`).join("\n")
                : "Hiện tại chưa có loại phòng nào được cấu hình.";

            return NextResponse.json({ reply });
        }

        if (intent === "ask_affordable_rooms_with_services" || intent === "ask_affordable_rooms") {
            // Parse thông tin từ tin nhắn
            const budget = parseMoneyFromText(message);
            const nights = parseNightsFromText(message);
            const people = parsePeopleFromText(message);
            const mentionedServices = await findMentionedServices(message);
            
            // Kiểm tra xem có yêu cầu thêm dịch vụ không
            const wantMoreServices = /thêm.*dịch vụ|dịch vụ.*thêm|thêm.*gì|có gì thêm/i.test(message);

            console.log(`Parsed - Budget: ${budget}, Nights: ${nights}, People: ${people}, Services: ${mentionedServices.map(s => s.tenDV).join(', ')}, WantMore: ${wantMoreServices}`);

            if (!budget || budget < 100000) {
                return NextResponse.json({
                    reply: "Vui lòng cung cấp số tiền cụ thể (ví dụ: 5 triệu, 2 triệu) để tôi tư vấn phòng phù hợp.",
                });
            }

            // Tính tổng chi phí dịch vụ (nhân với số người)
            let totalServiceCost = 0;
            if (mentionedServices.length > 0) {
                totalServiceCost = mentionedServices.reduce((sum, service) => 
                    sum + (Number(service.giaDV) * people), 0
                );
            }

            // Ngân sách còn lại cho phòng
            const remainingBudgetForRoom = budget - totalServiceCost;

            console.log(`Service cost: ${totalServiceCost}, Remaining for room: ${remainingBudgetForRoom}`);

            if (remainingBudgetForRoom <= 0) {
                return NextResponse.json({
                    reply: `Với ngân sách ${formatCurrency(budget)} cho ${people} người, sau khi trừ chi phí dịch vụ ${formatCurrency(totalServiceCost)}, không còn đủ tiền cho phòng.
                    
🛎️ Dịch vụ bạn đề cập (cho ${people} người):
${mentionedServices.map(s => `• ${s.tenDV}: ${formatCurrency(Number(s.giaDV))} × ${people} = ${formatCurrency(Number(s.giaDV) * people)}`).join('\n')}

Bạn có thể:
• Tăng ngân sách
• Giảm số người sử dụng dịch vụ  
• Bỏ bớt một số dịch vụ
• Chọn dịch vụ khác rẻ hơn`
                });
            }

            // Tìm phòng phù hợp
            const phong = await prisma.phong.findMany({
                where: {
                    gia: {
                        lte: remainingBudgetForRoom / nights,
                    },
                    tinhTrang: {
                        in: ["Trong"]
                    }
                },
                select: {
                    tenPhong: true,
                    gia: true,
                    tinhTrang: true,
                    loaiphong: {
                        select: {
                            tenLoaiPhong: true,
                            soNguoi: true,
                        },
                    },
                },
                orderBy: {
                    gia: 'asc'
                }
            });

            if (phong.length === 0) {
                return NextResponse.json({
                    reply: `Với ngân sách ${formatCurrency(budget)} cho ${nights} đêm${mentionedServices.length > 0 ? ` kèm dịch vụ cho ${people} người` : ''}, không tìm thấy phòng phù hợp.

${mentionedServices.length > 0 ? `🛎️ Chi phí dịch vụ cho ${people} người: ${formatCurrency(totalServiceCost)}
💰 Còn lại cho phòng: ${formatCurrency(remainingBudgetForRoom)}

` : ''}Bạn có thể:
• Tăng ngân sách lên
• Giảm số đêm xuống
• ${mentionedServices.length > 0 ? 'Giảm số người dùng dịch vụ hoặc b' : 'B'}ỏ bớt dịch vụ
• Chọn phòng cao cấp hơn với giá linh hoạt`
                });
            }

            // Tạo response với thông tin chi tiết
            let reply = `🏨 **GÓI DỊCH VỤ PHÙ HỢP VỚI NGÂN SÁCH ${formatCurrency(budget)}**

📅 Thời gian: ${nights} đêm
👥 Số người: ${people} người
${mentionedServices.length > 0 ? `🛎️ Dịch vụ kèm theo: ${mentionedServices.map(s => s.tenDV).join(', ')}` : ''}

**💎 CÁC PHÒNG PHÙ HỢP:**

`;

            phong.slice(0, 5).forEach((p, index) => {
                const roomTotal = Number(p.gia) * nights;
                const grandTotal = roomTotal + totalServiceCost;
                
                reply += `${index + 1}. 🛏️ **${p.tenPhong}** (${p.loaiphong.tenLoaiPhong})
   👥 Sức chứa: ${p.loaiphong.soNguoi} người
   💰 Phòng: ${formatCurrency(Number(p.gia))}/đêm × ${nights} = ${formatCurrency(roomTotal)}`;

                if (mentionedServices.length > 0) {
                    reply += `
   🛎️ Dịch vụ cho ${people} người: ${formatCurrency(totalServiceCost)}`;
                }

                reply += `
   💵 **Tổng cộng: ${formatCurrency(grandTotal)}**
   💸 Còn thừa: ${formatCurrency(budget - grandTotal)}

`;
            });

            if (mentionedServices.length > 0) {
                reply += `\n**🛎️ CHI TIẾT DỊCH VỤ CHO ${people} NGƯỜI:**
${mentionedServices.map(s => `• ${s.tenDV}: ${formatCurrency(Number(s.giaDV))}/người × ${people} = ${formatCurrency(Number(s.giaDV) * people)}`).join('\n')}`;
            }

            // Gợi ý thêm dịch vụ với số tiền thừa (hoặc toàn bộ nếu không có dịch vụ ban đầu)
            if (phong.length > 0) {
                const bestRoom = phong[0]; // Phòng rẻ nhất
                const roomTotal = Number(bestRoom.gia) * nights;
                const currentServiceCost = totalServiceCost;
                const usedBudget = roomTotal + currentServiceCost;
                const remainingBudget = budget - usedBudget;

                // Lấy tất cả dịch vụ
                const allServices = await prisma.dichvu.findMany({
                    select: {
                        maDV: true,
                        tenDV: true,
                        giaDV: true,
                      
                    },
                });

                const mentionedServiceIds = mentionedServices.map(s => s.maDV);
                
                // Nếu không có dịch vụ ban đầu hoặc có yêu cầu thêm dịch vụ
                if (mentionedServices.length === 0 || wantMoreServices || remainingBudget > 100000) {
                    const budgetForNewServices = mentionedServices.length === 0 ? 
                        remainingBudget : // Toàn bộ số tiền thừa nếu chưa có dịch vụ
                        remainingBudget;  // Số tiền thừa nếu đã có dịch vụ

                    const availableServices = allServices.filter(s => 
                        !mentionedServiceIds.includes(s.maDV) && 
                        Number(s.giaDV) * people <= budgetForNewServices
                    ).sort((a, b) => Number(b.giaDV) - Number(a.giaDV)); // Sắp xếp từ đắt đến rẻ

                    if (availableServices.length > 0) {
                        const headerText = mentionedServices.length === 0 ? 
                            `\n\n**🎯 GỢI Ý DỊCH VỤ THÊM VỚI NGÂN SÁCH ${formatCurrency(budgetForNewServices)}:**` :
                            `\n\n**💡 GỢI Ý THÊM DỊCH VỤ VỚI SỐ TIỀN THỪA ${formatCurrency(budgetForNewServices)}:**`;

                        reply += headerText;
                        reply += `\n${availableServices.slice(0, 4).map((s, idx) => {
    const serviceCostForPeople = Number(s.giaDV) * people;
    const finalRemaining = budgetForNewServices - serviceCostForPeople;
    return `${idx + 1}. 🎯 **${s.tenDV}**: ${formatCurrency(Number(s.giaDV))}/người × ${people} = ${formatCurrency(serviceCostForPeople)}
   : ''}
   💰 Còn lại: ${formatCurrency(finalRemaining)}`;
}).join('\n\n')}`;

                        if (availableServices.length > 4) {
                            reply += `\n\n📋 *Còn ${availableServices.length - 4} dịch vụ khác trong tầm ngân sách!*`;
                        }

                        // Gợi ý combo
                        if (availableServices.length >= 2) {
                            const combo = [];
                            let comboCost = 0;
                            for (const service of availableServices) {
                                const cost = Number(service.giaDV) * people;
                                if (comboCost + cost <= budgetForNewServices) {
                                    combo.push(service);
                                    comboCost += cost;
                                    if (combo.length >= 2) break;
                                }
                            }

                            if (combo.length >= 2) {
                                reply += `\n\n**🎁 COMBO ĐỀ XUẤT:**
🔥 ${combo.map(s => s.tenDV).join(' + ')}: ${formatCurrency(comboCost)}
💰 Tiết kiệm so với đặt lẻ và còn thừa: ${formatCurrency(budgetForNewServices - comboCost)}`;
                            }
                        }
                    } else if (mentionedServices.length === 0) {
                        reply += `\n\n💡 **Với số tiền thừa ${formatCurrency(budgetForNewServices)}**, bạn có thể nâng cấp lên phòng cao cấp hơn!`;
                    }
                }
            }

            if (phong.length > 5) {
                reply += `\n\n📝 *Còn ${phong.length - 5} phòng khác phù hợp. Liên hệ lễ tân để xem thêm!*`;
            }

            return NextResponse.json({ reply });
        }

        // Xử lý các intent khác...
        const dichVu = await prisma.dichvu.findMany({
            select: {
                tenDV: true,
                giaDV: true,
               
            },
        });

        const danhSachDichVu = dichVu.length
            ? dichVu.map((dv) =>
                  `• ${dv.tenDV} - ${formatCurrency(Number(dv.giaDV))} }`
              ).join("\n")
            : "Hiện chưa có dịch vụ bổ sung nào.";

        const servicePrompt = `Bạn là trợ lý tư vấn của Paradise Resort. Dưới đây là danh sách dịch vụ hiện có:

🛎️ Dịch vụ bổ sung:
${danhSachDichVu}

Khách hỏi: "${message}"

Ý định người dùng: "${intent}"

- Nếu là "check_service": liệt kê tất cả dịch vụ với tên
- Nếu là "ask_price": tập trung nói rõ giá các dịch vụ.
- Nếu là "general": hãy hỏi lại người dùng một cách lịch sự.
- Nếu là "ask_voucher": liệt kê tất cả ưu đãi đang có, bao gồm điều kiện và hạn sử dụng.
- Nếu là "ask_room_types": liệt kê tất cả các loại phòng đang có, bao gồm số người tối đa có thể ở.

Hãy trả lời bằng tiếng Việt, thân thiện, ngắn gọn và không vượt quá 150 từ.`;

        const completion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct",
            messages: [{ role: "user", content: servicePrompt }],
            max_tokens: 500,
            temperature: 0.7,
        });

        const reply = completion.choices[0].message.content;
        return NextResponse.json({ reply });
    } catch (error) {
        console.error("Lỗi trong API advisor:", error);
        return NextResponse.json({ error: "Lỗi server, vui lòng thử lại sau" }, { status: 500 });
    }
}