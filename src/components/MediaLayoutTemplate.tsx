import React from "react";
import { AspectRatio } from "./ui/aspect-ratio";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./ui/resizable";

// Example fixed layout: 3 zones (top banner, left main, right sidebar)
// You can adjust the number, position, and size of zones as needed

export interface MediaLayoutZone {
    id: string;
    label?: string;
    style?: React.CSSProperties;
}

export interface MediaLayoutTemplateProps {
    zones?: MediaLayoutZone[];
    aspectRatio?: number;
    zoneContents?: Record<string, React.ReactNode>; // NEW: content for each zone
}

const defaultZones: MediaLayoutZone[] = [
    {
        id: "zone-1",
        label: "Top Banner",
        style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "20%",
            border: "2px dashed #3b82f6",
            background: "rgba(59,130,246,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
        },
    },
    {
        id: "zone-2",
        label: "Main Area",
        style: {
            position: "absolute",
            top: "20%",
            left: 0,
            width: "70%",
            height: "80%",
            border: "2px dashed #10b981",
            background: "rgba(16,185,129,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
        },
    },
    {
        id: "zone-3",
        label: "Sidebar",
        style: {
            position: "absolute",
            top: "20%",
            left: "70%",
            width: "30%",
            height: "80%",
            border: "2px dashed #f59e42",
            background: "rgba(245,158,66,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
        },
    },
];

export const MediaLayoutTemplate: React.FC<MediaLayoutTemplateProps> = ({
    zones = defaultZones,
    aspectRatio = 16 / 9,
    zoneContents = {}, // NEW
}) => {
    return (
        <AspectRatio ratio={aspectRatio}>
            <div className="relative w-full h-full bg-white rounded-md shadow border overflow-hidden" style={{ minHeight: 320 }}>
                {zones.map((zone) => (
                    <div key={zone.id} style={zone.style}>
                        {zoneContents[zone.id] ? (
                            zoneContents[zone.id]
                        ) : (
                            <span className="text-xs text-gray-500 font-semibold pointer-events-none select-none">
                                {zone.label || zone.id}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </AspectRatio>
    );
};

export default MediaLayoutTemplate;
