import { NextResponse, type NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response, user } = await updateSupabaseSession(request);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      // Không còn trang /dang-nhap riêng — về trang chủ kèm query để SiteNav
      // tự mở modal đăng nhập, và biết đích đến sau khi đăng nhập thành công.
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("login", "1");
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);

      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
