import { supabase } from "@/lib/supabaseClient";
import { logActivity } from "@/api/logActivity";

// Remove unused properties and all Xibo API methods
export interface User {
  username: string;
  role: string;
}

class XiboAPI {
  constructor() {}

  // Only login method remains
  async login(username: string, password: string): Promise<string> {
    try {
      const functionUrl = import.meta.env.VITE_SUPABASE_FUNCTION_URL ||
        'http://localhost:54321/functions/v1/xibo-api';
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'login', username, password })
      });
      // Defensive: check for empty response
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server error: invalid response. Check your backend function URL and deployment.');
      }
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }
      localStorage.setItem('user_session_token', 'session');
      localStorage.setItem('xibo_user', JSON.stringify(data.user));
      return 'session';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async getDisplays() {
    const { data, error } = await supabase.from("displays").select("*");
    if (error) throw error;
    return data || [];
  }

  async getLayouts() {
    const { data, error } = await supabase.from("layouts").select("*");
    if (error) throw error;
    return data || [];
  }

  async getSchedules({ from, to } = {}) {
    let query = supabase.from("schedules").select("*");
    if (from && to) {
      query = query.gte("from_dt", from).lte("to_dt", to);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getMediaStats() {
    const { data, error } = await supabase.from("media").select("file_size");
    if (error) throw error;
    const totalSize = (data || []).reduce((sum, m) => sum + (m.file_size || 0), 0);
    return { totalSize };
  }

  async getUsers() {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    return data || [];
  }

  async getRecentActivities(limit = 10) {
    const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  }

  async getAlerts() {
    const { data, error } = await supabase.from("alerts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createDisplay(display, user_id) {
    const { data, error } = await supabase.from("displays").insert([display]).select();
    if (error) throw error;
    if (data && data[0]) {
      await logActivity({
        action_type: "create",
        entity: "display",
        entity_id: data[0].id,
        description: `Display '${data[0].name}' created`,
        user_id,
        meta: data[0]
      });
    }
    return data && data[0];
  }

  async updateDisplay(id, updates, user_id) {
    const { data, error } = await supabase.from("displays").update(updates).eq("id", id).select();
    console.log("Update result:", data, error);
    if (error) throw error;
    await logActivity({
      action_type: "modify",
      entity: "display",
      entity_id: id ? String(id) : null,
      description: data && data[0] ? `Display '${data[0].name}' updated` : `Display '${id}' updated`,
      user_id: user_id ?? null,
      meta: data && data[0] ? data[0] : null
    });
    return data && data[0];
  }

  async deleteDisplay(id, user_id) {
    const { data, error } = await supabase.from("displays").delete().eq("id", id).select();
    if (error) throw error;
    if (data && data[0]) {
      await logActivity({
        action_type: "delete",
        entity: "display",
        entity_id: id,
        description: `Display '${data[0].name}' deleted`,
        user_id,
        meta: data[0]
      });
    }
    return data && data[0];
  }

  async createLayout(layout, user_id) {
    layout.user_id = user_id;
    const { data, error } = await supabase.from("layouts").insert([layout]).select();
    if (error) throw error;
    if (data && data[0]) {
      await logActivity({
        action_type: "create",
        entity: "layout",
        entity_id: data[0].id,
        description: `Layout '${data[0].name}' created`,
        user_id,
        meta: data[0]
      });
    }
    return data && data[0];
  }

  async updateLayout(id, updates, user_id) {
    const { data, error } = await supabase.from("layouts").update(updates).eq("id", id).select();
    if (error) throw error;
    if (data && data[0]) {
      await logActivity({
        action_type: "edit",
        entity: "layout",
        entity_id: id,
        description: `Layout '${data[0].name}' updated`,
        user_id,
        meta: data[0]
      });
    }
    return data && data[0];
  }

  async deleteLayout(id, user_id) {
    const { data, error } = await supabase.from("layouts").delete().eq("id", id).select();
    if (error) throw error;
    if (data && data[0]) {
      await logActivity({
        action_type: "delete",
        entity: "layout",
        entity_id: id,
        description: `Layout '${data[0].name}' deleted`,
        user_id,
        meta: data[0]
      });
    }
    return data && data[0];
  }

  async createMedia(media, user_id) {
    media.user_id = user_id;
    const { data, error } = await supabase.from("media").insert([media]).select();
    if (error) throw error;
    if (data && data[0]) {
      await logActivity({
        action_type: "create",
        entity: "media",
        entity_id: data[0].id,
        description: `Media '${data[0].name}' created`,
        user_id,
        meta: data[0]
      });
    }
    return data && data[0];
  }

  async updateMedia(id, updates, user_id) {
    const { data, error } = await supabase.from("media").update(updates).eq("id", id).select();
    if (error) throw error;
    if (data && data[0]) {
      await logActivity({
        action_type: "edit",
        entity: "media",
        entity_id: id,
        description: `Media '${data[0].name}' updated`,
        user_id,
        meta: data[0]
      });
    }
    return data && data[0];
  }

  async deleteMedia(id, user_id) {
    const { data, error } = await supabase.from("media").delete().eq("id", id).select();
    if (error) throw error;
    if (data && data[0]) {
      await logActivity({
        action_type: "delete",
        entity: "media",
        entity_id: id,
        description: `Media '${data[0].name}' deleted`,
        user_id,
        meta: data[0]
      });
    }
    return data && data[0];
  }

  async logout() {
    // Remove session and user info from localStorage
    localStorage.removeItem('user_session_token');
    localStorage.removeItem('xibo_user');
    // Optionally, sign out from Supabase Auth as well
    await supabase.auth.signOut();
  }

  async clearAllActivities() {
    // Use .not('id', 'is', null) to match all rows (id is always present)
    const { error } = await supabase.from("activities").delete().not("id", "is", null);
    if (error) throw error;
    return true;
  }

  async deleteActivity(id: string | number) {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
}

export const xiboService = new XiboAPI();
