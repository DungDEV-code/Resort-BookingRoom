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

// Hàm parse ngày tháng từ text - CẢI THIỆN
const parseDatesFromText = (text: string): { checkIn: Date | null, checkOut: Date | null } => {
    const lowerText = text.toLowerCase();

    // Pattern cho các format ngày phổ biến
    const datePatterns = [
        // "1/8 tới 3/8", "1/8 đến 3/8"
        /(\d{1,2})\/(\d{1,2})\s*(?:tới|đến|to)\s*(\d{1,2})\/(\d{1,2})/i,
        // "ngày 1/8 tới ngày 3/8"
        /ngày\s*(\d{1,2})\/(\d{1,2})\s*(?:tới|đến)\s*(?:ngày\s*)?(\d{1,2})\/(\d{1,2})/i,
        // "từ 1/8 đến 3/8"
        /từ\s*(\d{1,2})\/(\d{1,2})\s*(?:đến|tới)\s*(\d{1,2})\/(\d{1,2})/i,
        // "1-8 tới 3-8" (dấu gạch ngang)
        /(\d{1,2})-(\d{1,2})\s*(?:tới|đến|to)\s*(\d{1,2})-(\d{1,2})/i,
    ];

    const currentYear = new Date().getFullYear();

    for (const pattern of datePatterns) {
        const match = lowerText.match(pattern);
        if (match) {
            const day1 = parseInt(match[1]);
            const month1 = parseInt(match[2]);
            const day2 = parseInt(match[3]);
            const month2 = parseInt(match[4]);

            // Validate ngày tháng
            if (day1 >= 1 && day1 <= 31 && month1 >= 1 && month1 <= 12 &&
                day2 >= 1 && day2 <= 31 && month2 >= 1 && month2 <= 12) {

                let checkIn = new Date(currentYear, month1 - 1, day1);
                let checkOut = new Date(currentYear, month2 - 1, day2);

                // Nếu ngày check-in đã qua, thì có thể là năm sau
                const today = new Date();
                if (checkIn < today) {
                    checkIn = new Date(currentYear + 1, month1 - 1, day1);
                    checkOut = new Date(currentYear + 1, month2 - 1, day2);
                }

                return { checkIn, checkOut };
            }
        }
    }

    // Pattern cho single date "vào ngày 1/8" (sẽ tự động tính checkout)
    const singleDatePatterns = [
        /vào\s*(?:ngày\s*)?(\d{1,2})\/(\d{1,2})/i,
        /ngày\s*(\d{1,2})\/(\d{1,2})/i,
    ];

    for (const pattern of singleDatePatterns) {
        const match = lowerText.match(pattern);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]);

            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                const nights = parseNightsFromText(text) || 1;
                let checkIn = new Date(currentYear, month - 1, day);

                const today = new Date();
                if (checkIn < today) {
                    checkIn = new Date(currentYear + 1, month - 1, day);
                }

                const checkOut = new Date(checkIn);
                checkOut.setDate(checkOut.getDate() + nights);

                return { checkIn, checkOut };
            }
        }
    }

    return { checkIn: null, checkOut: null };
};

// Hàm kiểm tra phòng trống trong khoảng thời gian
const getAvailableRooms = async (checkIn: Date, checkOut: Date, maxPrice?: number, minPeople?: number) => {
    // Lấy tất cả phòng
    const allRooms = await prisma.phong.findMany({
        where: {
            ...(maxPrice && { gia: { lte: maxPrice } }),
            ...(minPeople && { loaiphong: { soNguoi: { gte: minPeople } } }),
            tinhTrang: {
                in: ["Trong"] // Chỉ lấy phòng đang trống
            }
        },
        select: {
            maPhong: true,
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
    });

    // Tìm các phòng đã được đặt trong khoảng thời gian này
    const bookedRooms = await prisma.datphong.findMany({
        where: {
            trangThai: {
                in: ["ChoXacNhan", "Check_in"] // Các trạng thái được coi là đã đặt
            },
            OR: [
                // Trường hợp 1: booking bắt đầu trong khoảng thời gian cần check
                {
                    check_in: {
                        gte: checkIn,
                        lt: checkOut
                    }
                },
                // Trường hợp 2: booking kết thúc trong khoảng thời gian cần check
                {
                    check_out: {
                        gt: checkIn,
                        lte: checkOut
                    }
                },
                // Trường hợp 3: booking bao trùm hoàn toàn khoảng thời gian cần check
                {
                    check_in: { lte: checkIn },
                    check_out: { gte: checkOut }
                }
            ]
        },
        select: {
            maPhong: true,
        },
    });

    const bookedRoomIds = bookedRooms.map(booking => booking.maPhong);

    // Lọc ra các phòng còn trống
    const availableRooms = allRooms.filter(room =>
        !bookedRoomIds.includes(room.maPhong)
    );

    return availableRooms;
};

// Hàm tìm dịch vụ được đề cập
const findMentionedServices = async (text: string) => {
    const lowerText = text.toLowerCase();

    // Kiểm tra xem tin nhắn có chứa từ khóa dịch vụ không
    const serviceKeywords = [
        'dịch vụ', 'dich vu', 'spa', 'massage', 'mát xa', 'ăn', 'đồ ăn',
        'thức ăn', 'uống', 'đồ uống', 'nước uống', 'cocktail', 'bar',
        'gym', 'thể dục', 'fitness', 'pool', 'bể bơi', 'hồ bơi', 'tour',
        'tham quan', 'du lịch'
    ];

    if (!serviceKeywords.some(keyword => lowerText.includes(keyword))) {
        return []; // Không có dịch vụ được đề cập
    }

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
    const serviceCategories = {
        'spa': ['spa', 'massage', 'mát xa'],
        'ăn': ['ăn', 'đồ ăn', 'thức ăn', 'bữa ăn', 'món ăn'],
        'uống': ['uống', 'đồ uống', 'nước uống', 'cocktail', 'bar'],
        'gym': ['gym', 'thể dục', 'fitness'],
        'pool': ['pool', 'bể bơi', 'hồ bơi'],
        'tour': ['tour', 'tham quan', 'du lịch'],
    };

    for (const [category, keywords] of Object.entries(serviceCategories)) {
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

    // Kiểm tra có ngày tháng cụ thể không
    const hasSpecificDates = /\d{1,2}\/\d{1,2}|ngày\s*\d{1,2}|\d{1,2}-\d{1,2}/.test(normalizedMessage);

    // Cải thiện pattern để bắt các trường hợp phức tạp hơn
    const affordableRoomPatterns = [
        /ph\u00f2ng.*(d\u01b0\u1edbi|\u0111\u01b0\u1edbi|t\u1ed1i \u0111a|kho\u1ea3ng|<=?)\s*\d+/i,
        /c\u00f3.*ph\u00f2ng.*nào.*(d\u01b0\u1edbi|\u0111\u01b0\u1edbi)/i,
        /ph\u00f2ng.*gi\u00e1.*(d\u01b0\u1edbi|\u0111\u01b0\u1edbi|t\u1ed1i \u0111a)/i,
        /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|nghìn|k).*(?:\u0111\u00eam|đêm|ngày)/i,
        /c\u00f3.*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|nghìn|k)/i, // "có 5 triệu"
        /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|nghìn|k).*(?:ở|cho)/i, // "5 triệu ở 2 ngày"
        /còn.*ph\u00f2ng.*nào/i, // "còn phòng nào"
        /tổng.*tiền.*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/i, // "tổng tiền 5 triệu"
    ];

    for (const pattern of affordableRoomPatterns) {
        if (pattern.test(normalizedMessage)) {
            // Nếu có ngày tháng cụ thể thì là ask_available_rooms_with_dates
            return {
                intent: hasSpecificDates ? "ask_available_rooms_with_dates" : "ask_affordable_rooms_with_services"
            };
        }
    }

    const intentPrompt = `Phân tích tin nhắn sau và xác định ý định của người dùng:
Tin nhắn: "${message}"

Trả về JSON với trường:
- intent: string (ví dụ: "check_service", "ask_price", "general","ask_voucher","check_discount","ask_room_types","ask_affordable_rooms","ask_affordable_rooms_with_services","ask_available_rooms_with_dates")

Nếu tin nhắn có đề cập đến ngân sách + thời gian cụ thể (ngày/tháng) thì trả về "ask_available_rooms_with_dates"
Nếu tin nhắn có đề cập đến ngân sách + thời gian + dịch vụ nhưng không có ngày cụ thể thì trả về "ask_affordable_rooms_with_services"
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

        // XỬ LÝ INTENT MỚI - Kiểm tra phòng trống theo ngày cụ thể
        if (intent === "ask_available_rooms_with_dates") {
            const budget = parseMoneyFromText(message);
            const nights = parseNightsFromText(message);
            const people = parsePeopleFromText(message);
            const { checkIn, checkOut } = parseDatesFromText(message);
            const mentionedServices = await findMentionedServices(message);

            console.log(`Parsed dates - CheckIn: ${checkIn}, CheckOut: ${checkOut}, Budget: ${budget}, Nights: ${nights}, People: ${people}`);

            // Kiểm tra thông tin cơ bản
            if (!budget || budget < 100000) {
                return NextResponse.json({
                    reply: "Vui lòng cung cấp số tiền cụ thể (ví dụ: 5 triệu, 2 triệu) để tôi tư vấn phòng phù hợp.",
                });
            }

            if (!checkIn || !checkOut) {
                return NextResponse.json({
                    reply: "Vui lòng cung cấp ngày check-in và check-out cụ thể (ví dụ: từ 1/8 đến 3/8) để tôi kiểm tra phòng trống.",
                });
            }

            // Kiểm tra ngày check-out phải sau check-in
            if (checkOut <= checkIn) {
                return NextResponse.json({
                    reply: "Ngày check-out phải sau ngày check-in.",
                }, { status: 400 });
            }

            // Tính số đêm thực tế từ ngày
            const actualNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

            // Chỉ tính chi phí dịch vụ nếu có dịch vụ được đề cập
            let totalServiceCost = 0;
            let maxRoomPricePerNight = budget / actualNights;

            if (mentionedServices.length > 0) {
                totalServiceCost = mentionedServices.reduce((sum, service) =>
                    sum + (Number(service.giaDV) * people), 0
                );
                maxRoomPricePerNight = (budget - totalServiceCost) / actualNights;
            }

            // Kiểm tra nếu ngân sách cho phòng không đủ
            if (maxRoomPricePerNight <= 0 && mentionedServices.length > 0) {
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

            // Lấy phòng trống trong khoảng thời gian
            const availableRooms = await getAvailableRooms(checkIn, checkOut, maxRoomPricePerNight, people);

            if (availableRooms.length === 0) {
                // Kiểm tra xem có phòng nào trong ngân sách nhưng đã được đặt không
                const allRoomsInBudget = await getAvailableRooms(checkIn, checkOut, undefined, people);
                const affordableRooms = allRoomsInBudget.filter(room => Number(room.gia) <= maxRoomPricePerNight);

                if (affordableRooms.length === 0) {
                    let reply = `😔 **KHÔNG TÌM THẤY PHÒNG PHÙ HỢP**

📅 Thời gian: ${checkIn.toLocaleDateString("vi-VN")} - ${checkOut.toLocaleDateString("vi-VN")} (${actualNights} đêm)
💰 Ngân sách: ${formatCurrency(budget)}
👥 Số người: ${people} người
${mentionedServices.length > 0 ? `🛎️ Chi phí dịch vụ: ${formatCurrency(totalServiceCost)}\n💵 Ngân sách cho phòng: ${formatCurrency(budget - totalServiceCost)}` : ''}

**Gợi ý:**
• Tăng ngân sách
• Thay đổi ngày ở (tránh peak time)
• Giảm số đêm
${mentionedServices.length > 0 ? '• Bỏ bớt dịch vụ' : ''}
• Liên hệ trực tiếp để được tư vấn phòng cao cấp hơn`;
                    return NextResponse.json({ reply });
                } else {
                    return NextResponse.json({
                        reply: `😔 **TẤT CẢ PHÒNG TRONG NGÂN SÁCH ĐÃ ĐƯỢC ĐẶT**

📅 Thời gian: ${checkIn.toLocaleDateString("vi-VN")} - ${checkOut.toLocaleDateString("vi-VN")} (${actualNights} đêm)
💰 Ngân sách: ${formatCurrency(budget)}
👥 Số người: ${people} người

Có ${affordableRooms.length} phòng phù hợp ngân sách nhưng đã có khách đặt trong thời gian này.

**Gợi ý:**
• Thay đổi ngày check-in/check-out
• Đặt sớm hơn cho lần sau
• Liên hệ để được thông báo khi có phòng trống do hủy đặt`
                    });
                }
            }

            // Tạo response với phòng có sẵn
            let reply = `🏨 **PHÒNG CÒN TRỐNG TRONG NGÂN SÁCH ${formatCurrency(budget)}**

📅 **Thời gian:** ${checkIn.toLocaleDateString("vi-VN")} - ${checkOut.toLocaleDateString("vi-VN")} (${actualNights} đêm)
👥 **Số người:** ${people} người
${mentionedServices.length > 0 ? `🛎️ **Dịch vụ kèm theo:** ${mentionedServices.map(s => s.tenDV).join(', ')}` : ''}

**💎 CÁC PHÒNG CÒN TRỐNG:**

`;

            availableRooms.slice(0, 5).forEach((room, index) => {
                const roomTotal = Number(room.gia) * actualNights;
                const grandTotal = roomTotal + totalServiceCost;

                reply += `${index + 1}. 🛏️ **${room.tenPhong}** (${room.loaiphong.tenLoaiPhong})
   👥 Sức chứa: ${room.loaiphong.soNguoi} người
   💰 Phòng: ${formatCurrency(Number(room.gia))}/đêm × ${actualNights} = ${formatCurrency(roomTotal)}`;

                if (mentionedServices.length > 0) {
                    reply += `
   🛎️ Dịch vụ cho ${people} người: ${formatCurrency(totalServiceCost)}`;
                }

                reply += `
   💵 **Tổng cộng: ${formatCurrency(grandTotal)}**
   💸 Còn thừa: ${formatCurrency(budget - grandTotal)}
   ✅ **Có thể đặt ngay!**

`;
            });

            if (mentionedServices.length > 0) {
                reply += `\n**🛎️ CHI TIẾT DỊCH VỤ CHO ${people} NGƯỜI:**
${mentionedServices.map(s => `• ${s.tenDV}: ${formatCurrency(Number(s.giaDV))}/người × ${people} = ${formatCurrency(Number(s.giaDV) * people)}`).join('\n')}`;
            }

            if (availableRooms.length > 5) {
                reply += `\n\n📝 *Còn ${availableRooms.length - 5} phòng khác có sẵn trong thời gian này!*`;
            }

            // Thêm lưu ý về việc đặt phòng
            reply += `\n\n⚡ **LƯU Ý:** Số lượng phòng trống có thể thay đổi nhanh. Liên hệ ngay để đặt phòng và được hỗ trợ tốt nhất!`;

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
                    },
                    loaiphong: {
                        soNguoi: { gte: people }
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
                `• ${dv.tenDV} - ${formatCurrency(Number(dv.giaDV))}`
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