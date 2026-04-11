import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, Monitor, LayoutTemplate, Calendar, User, ActivitySquare, Image as MediaIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationButton } from "./NotificationButton";
import { UserProfileButton } from "./UserProfileButton";
import { TourDropdown } from "./TourDropdown";
import { xiboService } from "@/services/XiboAPI";
import { supabase } from "@/lib/supabaseClient";

interface DisplayResult {
  type: "Display";
  id: number | string;
  name: string;
}
interface LayoutResult {
  type: "Layout";
  id: number | string;
  name: string;
}
interface ScheduleResult {
  type: "Schedule";
  id: number | string;
  campaign?: string;
}
interface UserResult {
  type: "User";
  id: number | string;
  username?: string;
  name?: string;
}
interface ActivityResult {
  type: "Activity";
  id: number | string;
  description?: string;
}
interface MediaResult {
  type: "Media";
  id: number | string;
  name: string;
}
interface ErrorResult {
  type: "Error";
  message: string;
}
type SearchResult = DisplayResult | LayoutResult | ScheduleResult | UserResult | ActivityResult | MediaResult | ErrorResult;

const Navbar = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleGlobalSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearching(true);
    setShowResults(true);
    const q = search.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    try {
      const [displays, layouts, schedules, users, activities, media] = await Promise.all([
        xiboService.getDisplays(),
        xiboService.getLayouts(),
        xiboService.getSchedules({}),
        xiboService.getUsers(),
        xiboService.getRecentActivities(100),
        supabase.from("media").select("id, name")
      ]);
      const match = (obj: Record<string, unknown>, fields: string[]) =>
        fields.some(f => typeof obj[f] === "string" && (obj[f] as string).toLowerCase().includes(q));
      const results: SearchResult[] = [];
      (displays as any[]).filter(d => match(d, ["name"]) || match(d, ["username"]))
        .forEach(d => results.push({ type: "Display", id: d.id, name: d.name }));
      (layouts as any[]).filter(l => match(l, ["name"]))
        .forEach(l => results.push({ type: "Layout", id: l.id, name: l.name }));
      (schedules as any[]).filter(s => match(s, ["campaign"]))
        .forEach(s => results.push({ type: "Schedule", id: s.id, campaign: s.campaign }));
      (users as any[]).filter(u => match(u, ["username", "name"]))
        .forEach(u => results.push({ type: "User", id: u.id || u.auth_uid, username: u.username, name: u.name }));
      (activities as any[]).filter(a => match(a, ["description", "username", "user_id"]))
        .forEach(a => results.push({ type: "Activity", id: a.id, description: a.description }));
      if (media && media.data) {
        (media.data as any[]).filter(m => match(m, ["name"]))
          .forEach(m => results.push({ type: "Media", id: m.id, name: m.name }));
      }
      setSearchResults(results);
    } catch (err) {
      setSearchResults([{ type: "Error", message: "Search failed. Please try again." }]);
    }
    setSearching(false);
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-lg z-10 dark:border-primary/10">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SidebarTrigger>
          {!isMobile && (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                Blue Vision
              </h1>
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative hidden md:block">
            <form onSubmit={handleGlobalSearch}>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search everything (name, username, etc.)..."
                className="w-64 rounded-full bg-background/50 pl-8 md:w-80 lg:w-96 dark:bg-secondary/30 dark:focus:bg-secondary/50 transition-colors duration-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
            </form>
            {showResults && search && (
              <div className="absolute left-0 mt-2 w-full bg-card rounded-lg shadow p-4 z-50">
                <h3 className="font-bold mb-2">Search Results</h3>
                {searchResults.length === 0 && !searching && <div className="text-muted-foreground">No results found.</div>}
                {searchResults.length > 0 && (
                  <ul className="divide-y divide-border">
                    {searchResults.map((r, i) => {
                      let to = null;
                      let label = null;
                      let Icon = null;
                      if (r.type === "Display") {
                        to = `/displays`;
                        label = r.name;
                        Icon = Monitor;
                      } else if (r.type === "Layout") {
                        to = `/layouts`;
                        label = r.name;
                        Icon = LayoutTemplate;
                      } else if (r.type === "Schedule") {
                        to = `/schedules`;
                        label = r.campaign;
                        Icon = Calendar;
                      } else if (r.type === "User") {
                        to = `/users`;
                        label = r.username || r.name;
                        Icon = User;
                      } else if (r.type === "Media") {
                        to = `/media-library`;
                        label = r.name;
                        Icon = MediaIcon;
                      } else if (r.type === "Activity") {
                        to = `/dashboard`;
                        label = r.description;
                        Icon = ActivitySquare;
                      }
                      return (
                        <li
                          key={"id" in r ? r.id : i}
                          className="group py-2 px-3 rounded-lg transition-colors cursor-pointer hover:bg-primary/10 flex items-center gap-3"
                          onMouseDown={e => { e.preventDefault(); if (to) navigate(to, { replace: false }); }}
                        >
                          {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
                          <span className="text-base font-medium text-foreground truncate">{label}</span>
                          {r.type === "Error" && <span className="text-red-500">{r.message}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
          <NotificationButton />
          <TourDropdown />
          <div className="hidden md:block">
            <UserProfileButton />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-primary/10 dark:hover:text-primary transition-colors"
          >
            <UserProfileButton />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
