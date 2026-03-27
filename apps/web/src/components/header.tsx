"use client";
import { useClerk, useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import { Button } from "@PeerFolio/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@PeerFolio/ui/components/dropdown-menu";
import { useMutation, useQuery } from "convex/react";
import { Avatar } from "@heroui/react";
import { Bell, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const me = useQuery(api.users.queries.getMe);
  const unreadNotifications = useQuery(
    api.users.queries.getUnreadNotifications,
    {},
  );
  const markNotificationsAsRead = useMutation(
    api.users.mutations.markNotificationsAsRead,
  );
  const lastNotifiedCountRef = useRef(0);

  const unreadCount = unreadNotifications?.length ?? 0;

  useEffect(() => {
    if (!isSignedIn) {
      lastNotifiedCountRef.current = 0;
      return;
    }

    if (unreadCount > 0 && unreadCount !== lastNotifiedCountRef.current) {
      toast.info(
        unreadCount === 1
          ? "Voce tem 1 notificacao pendente"
          : `Voce tem ${unreadCount} notificacoes pendentes`,
      );
      lastNotifiedCountRef.current = unreadCount;
    }
  }, [isSignedIn, unreadCount]);

  const handleMarkAllAsRead = async () => {
    if (!unreadNotifications || unreadNotifications.length === 0) {
      return;
    }

    const result = await markNotificationsAsRead({
      notificationIds: unreadNotifications.map(
        (notification) => notification._id,
      ),
    });

    if (result.updatedCount > 0) {
      toast.success(
        result.updatedCount === 1
          ? "1 notificacao marcada como lida"
          : `${result.updatedCount} notificacoes marcadas como lidas`,
      );
    }
  };

  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  const landingLinks = [
    { to: "/feed", label: "Explorar" },
    { to: "#portfolios", label: "Comunidade" },
  ] as const;

  const appLinks = [
    { to: "/feed", label: "Feed" },
    { to: "/submit", label: "Submeter" },
  ] as const;

  const links = isLandingPage ? landingLinks : appLinks;

  const authSection = (
    <div className="flex items-center gap-3">
      {isSignedIn && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="Abrir notificacoes"
                className="border-white/10 bg-transparent hover:bg-white/5 text-white/80 transition-colors"
              />
            }
          >
            <span className="relative inline-flex">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-white/10 bg-[#131313]/95 backdrop-blur-xl text-white">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-serif text-lg text-white/90">Notificacoes</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/5" />

            <DropdownMenuGroup>
              {unreadCount === 0 ? (
                <DropdownMenuItem disabled className="text-white/50">
                  Nenhuma notificacao pendente
                </DropdownMenuItem>
              ) : (
                unreadNotifications?.map((notification) => (
                  <DropdownMenuItem
                    key={notification._id}
                    className="flex-col items-start gap-1 focus:bg-white/10 transition-colors"
                  >
                    <span className="text-xs font-semibold text-white/90">
                      {notification.title}
                    </span>
                    <span className="text-xs text-white/60">
                      {notification.message}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>

            {unreadCount > 0 && (
              <>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    onClick={handleMarkAllAsRead}
                    className="text-primary focus:bg-primary/10 focus:text-primary"
                  >
                    Marcar todas como lidas
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ModeToggle />
      {isSignedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 cursor-pointer outline-none ring-2 ring-transparent focus:ring-primary/50 rounded-full transition-all p-0 bg-transparent border-none">
            {me?.avatarUrl ? (
              <Avatar
                size="sm"
                src={me.avatarUrl}
                alt={me.nickname ?? "Avatar do usuário"}
              />
            ) : (
              <Avatar
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                <Avatar.Fallback className="text-xs">
                  {me?.nickname?.charAt(0).toUpperCase() ?? user?.firstName?.charAt(0).toUpperCase() ?? "?"}
                </Avatar.Fallback>
              </Avatar>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#131313]/95 backdrop-blur-xl text-white">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{me?.nickname ?? user?.fullName ?? "Usuário"}</p>
                  <p className="text-xs leading-none text-white/60">{user?.emailAddresses[0]?.emailAddress}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link href={`/dashboard/${me?._id}`} className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => signOut({ redirectUrl: "/" })}
                className="text-danger focus:text-danger focus:bg-danger/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href={"/sign-in" as any} className="ml-2">
          <Button size="sm" className="bg-primary hover:bg-secondary text-white border-0 shadow-[0_0_15px_rgba(132,94,247,0.2)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(132,94,247,0.4)] px-6 rounded-md font-medium">
            Entrar
          </Button>
        </Link>
      )}
    </div>
  );

  if (isLandingPage) {
    return (
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="font-serif text-3xl font-bold tracking-tight text-white italic transition-transform hover:scale-[1.02]">
            PeerFolio
          </Link>
          
          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-8 text-sm font-medium">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                href={to as any}
                className="relative text-white/70 transition-colors hover:text-white group py-2"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
            ))}
          </nav>

          {authSection}
        </div>
      </header>
    );
  }

  // APP FEED NAVBAR
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#131313]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-white italic transition-transform hover:scale-[1.02]">
            PeerFolio
          </Link>
          <nav className="hidden md:flex gap-2 text-sm font-medium">
            {links.map(({ to, label }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
                  href={to as any}
                  className={`relative px-4 py-2 rounded-md transition-all ${
                    isActive 
                      ? "text-white bg-white/10 font-semibold" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-t-sm" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        {authSection}
      </div>
    </header>
  );
}
