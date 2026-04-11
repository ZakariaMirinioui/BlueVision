// @deno-types="https://deno.land/x/supabase@1.3.1/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Add type imports
import type { Database } from "../../../src/types/database.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid file types for media uploads
const validFileTypes = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  document: [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv"
  ]
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    // Parse the body of the request early to get path and other fields
    let requestData: Record<string, unknown> = {};
    try {
      requestData = await req.json();
    } catch { /* Ignore JSON parse errors for non-JSON requests */ }
    const path = requestData?.path;
    const username = requestData?.username;
    const password = requestData?.password;
    const email = requestData?.email;
    const id = requestData?.id;
    const displayId = requestData?.displayId;
    const command = requestData?.command;
    const displayIds = requestData?.displayIds;
    const message = requestData?.message;
    const options = requestData?.options;

    // For register and login, skip auth header check
    if ((path === 'register' || path === 'login') && req.method !== 'OPTIONS') {
      // Create a Supabase client without auth header
      const supabaseUrl = typeof globalThis.Deno !== 'undefined' ? globalThis.Deno.env.get("SUPABASE_URL") ?? "" : '';
      const supabaseKey = typeof globalThis.Deno !== 'undefined' ? (globalThis.Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? globalThis.Deno.env.get("SUPABASE_ANON_KEY") ?? "") : '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (path === 'register') {
        // Insert user into users table (plain password, no hash)
        const { data: userInsert, error: userInsertError } = await supabase.from('users').insert({
          username,
          password,
          role: 'user',
          created_at: new Date().toISOString()
        });
        if (userInsertError) {
          return new Response(JSON.stringify({ error: userInsertError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify({ success: true, user: userInsert }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path === 'login') {
        // Fetch user from users table and compare plain password
        const { data: userData, error: userFetchError } = await supabase.from('users').select('*').eq('username', username).single();
        if (userFetchError || !userData) {
          return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        if (userData.password !== password) {
          return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify({ success: true, user: userData }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // For other paths, check auth header
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Create a Supabase client with the auth header
    const supabaseUrl = typeof globalThis.Deno !== 'undefined' ? globalThis.Deno.env.get("SUPABASE_URL") ?? "" : '';
    const supabaseKey = typeof globalThis.Deno !== 'undefined' ? globalThis.Deno.env.get("SUPABASE_ANON_KEY") ?? "" : '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Route the request based on the path parameter
    let data;
    let error;

    switch (path) {
      case 'login': {
        console.log(`Login attempt for user: ${username}`);
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
          data = {
            success: true,
            user: {
              username: user.username,
              role: user.role
            },
            token: "mock-jwt-token-for-demo-purposes"
          };
        } else {
          return new Response(JSON.stringify({
            error: "Invalid username or password"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        break;
      }

      case 'displays':
        console.log("Getting displays from database");
        ({ data, error } = await supabase.from('displays').select('*'));
        break;

      case 'display-status':
        console.log(`Getting status for display ${id}`);
        ({ data, error } = await supabase.from('displays').select('*').eq('id', id).single());

        if (data) {
          // Transform to match DisplayStatus interface
          data = {
            displayId: data.id,
            status: data.status || 'offline',
            lastPing: data.last_ping,
            currentLayout: data.current_layout || 'Unknown',
            storage: data.storage_usage || 0,
            storageTotalSpace: data.storage_total || 1000000000,
            storagePercentage: data.storage_usage && data.storage_total ?
              (data.storage_usage / data.storage_total) * 100 : 0,
            loggedIn: true,
            licensed: true,
            currentLayoutId: 1
          };
        }
        break;

      case 'layouts':
        console.log("Getting layouts from database");
        const { data: layoutData, error: layoutError } = await supabase
          .from('layouts')
          .select(`
            *,
            layout_media (
              media_id,
              media (
                id,
                name,
                type,
                file_type,
                url
              )
            )
          `);

        if (layoutError) {
          error = layoutError;
          break;
        }

        if (layoutData) {
          // Transform to match Layout interface
          data = layoutData.map(layout => {
            // Get the first media item's URL as thumbnail if available
            const mediaItems = layout.layout_media || [];
            const firstMediaUrl = mediaItems.length > 0 && mediaItems[0].media ?
              mediaItems[0].media.url : '/placeholder.svg';

            return {
              layoutId: layout.id,
              layout: layout.name,
              description: layout.description || '',
              duration: layout.duration || 0,
              statusMessage: '',
              status: layout.status === 'published' ? 1 : 0,
              enableStat: true,
              permissions: ['view'],
              publishedStatusId: layout.status === 'published' ? 1 : 0,
              publishedStatus: layout.status || 'Unknown',
              tags: [],
              thumbnail: layout.thumbnail_url || firstMediaUrl,
              owner: layout.creator || 'Admin',
              ownerId: 1,
              campaignId: 1,
              media: mediaItems.map(item => ({
                id: item.media?.id,
                name: item.media?.name,
                type: item.media?.type,
                fileType: item.media?.file_type,
                url: item.media?.url
              }))
            };
          });
        }
        break;

      case 'schedules':
        console.log("Getting schedules from database");
        ({ data, error } = await supabase.from('schedules').select('*'));
        break;

      case 'media':
        console.log("Getting media from database");
        ({ data, error } = await supabase.from('media').select('*'));

        if (data) {
          // Transform to match Media interface
          data = data.map(item => ({
            mediaId: item.id,
            name: item.name,
            type: item.type,
            duration: item.duration || 0,
            fileSize: item.file_size || 0,
            owner: item.owner || 'Admin',
            retired: item.retired ? 1 : 0,
            enableStat: item.enable_stat ?? true,
            tags: item.tags || [],
            released: item.released ? 1 : 0,
            url: item.url || null,
            fileType: item.file_type || null
          }));
        }
        break;

      case 'send-command':
        console.log(`Sending command ${command} to display ${displayId}`);

        // Update the display in the database with a new status
        if (command === "reboot") {
          await supabase.from('displays')
            .update({ status: 'warning', last_ping: new Date().toISOString() })
            .eq('id', displayId);
        }

        data = {
          success: true,
          message: `Command ${command} sent to display ${displayId}`
        };
        break;

      case 'send-message': {
        console.log(`Sending message to displays: ${displayIds?.join(", ")}`);
        console.log(`Message: ${message}`);
        console.log(`Options: ${JSON.stringify(options)}`);

        // In a real implementation, this would send the message to the displays via the Xibo CMS
        // For now, we'll update the display records to reflect that a message was sent
        const headline = options?.headline || "System Message";
        const duration = options?.duration || 15;
        const isPriority = options?.isPriority || false;

        // Update the displays to show they have a new message
        if (displayIds && displayIds.length > 0) {
          const now = new Date().toISOString();

          // Get current displays
          const { data: currentDisplays } = await supabase
            .from('displays')
            .select('id, current_layout')
            .in('id', displayIds);

          // Update each display to show it's displaying the message
          for (const display of currentDisplays || []) {
            await supabase.from('displays')
              .update({
                current_layout: `${headline} (Message)`,
                last_ping: now
              })
              .eq('id', display.id);
          }
        }

        data = {
          success: true,
          message: `Message "${headline}" sent to ${displayIds ? displayIds.length : 0} displays`,
          displayIds,
          sentAt: new Date().toISOString()
        };
        break;
      }

      case 'assign-media': {
        const { mediaId, layoutId } = requestData;
        console.log(`Assigning media ${mediaId} to layout ${layoutId}`);

        // Add media to layout_media table
        const { error: assignError } = await supabase
          .from('layout_media')
          .insert({
            layout_id: layoutId,
            media_id: mediaId,
            created_at: new Date().toISOString()
          });

        if (assignError) {
          error = assignError;
          break;
        }

        // Get media details to update layout thumbnail
        const { data: mediaItem } = await supabase
          .from('media')
          .select('*')
          .eq('id', mediaId)
          .single();

        if (mediaItem && mediaItem.url) {
          // Update layout thumbnail with the media URL
          const { error: updateError } = await supabase
            .from('layouts')
            .update({ thumbnail_url: mediaItem.url })
            .eq('id', layoutId)
            .is('thumbnail_url', null);

          if (updateError) {
            error = updateError;
            break;
          }
        }

        data = {
          success: true,
          message: `Media assigned to layout successfully`
        };
        break;
      }

      case 'register-display': {
        console.log('Registering new display');
        const { displayName, location, groupName } = requestData;

        // Insert new display record with connection details
        const { data: newDisplay, error: registerError } = await supabase
          .from('displays')
          .insert({
            name: displayName,
            location: location,
            group_name: groupName,
            status: 'offline',
            cms_key: crypto.randomUUID(), // Generate a unique CMS key
            connection_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/xibo-api`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (registerError) {
          error = registerError;
          break;
        }

        data = {
          displayId: newDisplay.id,
          cmsKey: newDisplay.cms_key,
          connectionUrl: newDisplay.connection_url,
          message: 'Display registered successfully'
        };
        break;
      }

      case 'connect-display': {
        console.log('Display connection attempt');
        const { displayId: connectId, cmsKey, hardwareKey, clientVersion, clientIp } = requestData;

        // Verify display credentials
        const { data: existingDisplay, error: verifyError } = await supabase
          .from('displays')
          .select('*')
          .eq('id', connectId)
          .eq('cms_key', cmsKey)
          .single();

        if (verifyError || !existingDisplay) {
          return new Response(JSON.stringify({
            error: 'Invalid display credentials'
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Update display connection status and details
        const { error: updateError } = await supabase
          .from('displays')
          .update({
            status: 'online',
            last_ping: new Date().toISOString(),
            hardware_key: hardwareKey,
            client_version: clientVersion,
            client_ip: clientIp || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
          })
          .eq('id', connectId);

        if (updateError) {
          error = updateError;
          break;
        }

        data = {
          success: true,
          message: 'Display connected successfully'
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown API path: ${path}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing request:", error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
