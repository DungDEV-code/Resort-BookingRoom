import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Services {
  maDV: string;
  tenDV: string;
  moTaDV: string;
  giaDV: number;
  anhDV: string;
  icon?: React.ReactNode;

  color?: string;
  features?: string[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export function Service({
  maDV,
  tenDV,
  moTaDV,
  giaDV,
  anhDV,
  icon,
  color = "bg-sky-600",
  features = [],
}: Services) {
  return (
    <Card className="overflow-hidden transition-all group relative hover:shadow-xl p-0">
      <div className="relative w-full h-64 overflow-hidden">
        <Image
          src={`/img/${anhDV || "placeholder.svg"}`}
          alt={tenDV}
          fill
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        {icon && (
          <div
            className={cn(
              "absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full shadow-md",
              "bg-white/80 text-sky-600 backdrop-blur-sm"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Nội dung sẽ bị đẩy lên khi hover */}
      <div className="transition-all duration-500 ease-in-out group-hover:-translate-y-8 px-6 pt-6 pb-10">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-xl">{tenDV}</CardTitle>
          <CardDescription className="line-clamp-2">{moTaDV}</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <ul className="mb-4 space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-muted-foreground">
                <div className="mr-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="text-sky-600 font-semibold text-base">
            Giá: {formatCurrency(giaDV)}
          </div>
        </CardContent>
      </div>

      {/* Nút "Khám Phá" xuất hiện bên dưới */}
      <Link
        href={`/services/${maDV}`}
        className="absolute inset-x-6 bottom-4 
             text-center text-white font-semibold text-base
             opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0
             transition-all duration-500 ease-in-out
             rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600
             shadow-lg hover:shadow-xl px-6 py-3
             group/link"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          Khám Phá
          <Sparkles className="h-5 w-5 transform transition-transform duration-300 group-hover/link:scale-110" />
        </span>
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover/link:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      </Link>
    </Card>

  );
}

export default Service;
