"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpenText, Menu, X, LogOut, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/actions/auth";

type CurrentUser = {
  name: string;
  role: "SUPER_ADMIN" | "TEACHER";
};

function NavLinks({ user, onNavigate }: { user: CurrentUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.superAdminOnly || user.role === "SUPER_ADMIN");

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <BookOpenText className="size-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">حلقات الغفران</span>
        <span className="text-xs text-muted-foreground leading-tight">تحفيظ القرآن الكريم</span>
        <span className="text-[10px] font-light text-muted-foreground/80 leading-tight">
          خيركم من تعلم القرآن وعلمه
        </span>
      </div>
    </div>
  );
}

function UserMenu({ user }: { user: CurrentUser }) {
  const initial = user.name.trim().charAt(0) || "؟";
  const roleLabel = user.role === "SUPER_ADMIN" ? "الشيخ الرئيسي" : "مدرس";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto gap-2 px-2 py-1.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary">{initial}</AvatarFallback>
          </Avatar>
          <span className="hidden text-start sm:flex sm:flex-col">
            <span className="text-sm font-medium leading-tight">{user.name}</span>
            <span className="text-xs text-muted-foreground leading-tight">{roleLabel}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <KeyRound />
            تغيير كلمة المرور
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button type="submit" className="w-full">
            <DropdownMenuItem variant="destructive" asChild>
              <span>
                <LogOut />
                تسجيل الخروج
              </span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-e bg-card p-4 md:flex">
        <BrandHeader />
        <NavLinks user={user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu />
            </Button>
            <span className="font-semibold md:hidden">حلقات الغفران</span>
          </div>
          <UserMenu user={user} />
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 md:hidden" />
          <DialogPrimitive.Content
            className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col gap-4 bg-card p-4 shadow-lg md:hidden"
          >
            <DialogPrimitive.Title className="sr-only">القائمة</DialogPrimitive.Title>
            <div className="flex items-center justify-between">
              <BrandHeader />
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" aria-label="إغلاق القائمة">
                  <X />
                </Button>
              </DialogPrimitive.Close>
            </div>
            <NavLinks user={user} onNavigate={() => setMobileOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
