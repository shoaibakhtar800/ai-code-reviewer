import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import {
  ChevronDownIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface UserProps {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

export const UserMenu = ({ user }: { user: UserProps }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/sign-in");
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-full px-2 py-1 transition-colors">
          <Avatar className="h-9 w-9 border-2 border-border">
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block text-sm font-medium max-w-25 truncate">
            {user.name ?? "User"}
          </span>
          <ChevronDownIcon className="size-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-1 ring-border">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                {user.name ?? "User"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user.email ?? "Email"}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 py-2 cursor-pointer"
          onClick={handleProfile}
        >
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 py-2 cursor-pointer"
          onClick={handleSettings}
        >
          <SettingsIcon className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 py-2 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOutIcon className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
