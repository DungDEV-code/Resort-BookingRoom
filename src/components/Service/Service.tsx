import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Services {
  maDV: string;
  tenDV: string;
  moTaDV: string;
  giaDV: number;
  anhDV: string;
//   icon?: React.ReactNode;
//   href?: string;
  color?: string;
  features?: string[];
}

export function Service({
    maDV,
  tenDV,
  moTaDV,
  giaDV,
  anhDV,
//   icon,
//   href = "#",
  color = "bg-sky-600",
  features = [],
}: Services) {
  return (
    <Card  className="overflow-hidden transition-all hover:shadow-xl group">
      <div className="relative w-full h-64 overflow-hidden rounded-xl">
        <Image
          src={`/img/${anhDV || "placeholder.svg"}`}
          alt={tenDV}
          fill
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        {/* {icon && (
          <div
            className={cn(
              "absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full text-white",
              color
            )}
          >
            {icon}
          </div>
        )} */}
      </div>
      <CardHeader>
        <CardTitle className="text-xl">{tenDV}</CardTitle>
        <CardDescription>{moTaDV}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="mb-4 space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-muted-foreground">
              <div className="mr-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="text-base font-semibold mb-4 text-sky-600">
          Giá: {giaDV.toLocaleString("vi-VN")}₫
        </div>
        <Button asChild className="w-full">
          {/* <Link href={href}>
            Khám Phá
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link> */}
        </Button>
      </CardContent>
    </Card>
  );
}
export default Service;