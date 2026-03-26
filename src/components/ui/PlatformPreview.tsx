"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Platform = "ig_feed" | "ig_story" | "fb_feed" | "tt_feed";

const PLATFORMS: { id: Platform; label: string; icon: "feed" | "story" }[] = [
    { id: "ig_feed", label: "Instagram Feed", icon: "feed" },
    { id: "ig_story", label: "Instagram Story", icon: "story" },
    { id: "fb_feed", label: "Facebook Feed", icon: "feed" },
    { id: "tt_feed", label: "TikTok Feed", icon: "story" },
];

interface PlatformPreviewProps {
    src: string;
    onClose: () => void;
    brandName?: string;
}

export function PlatformPreview({ src, onClose, brandName = "your_brand" }: PlatformPreviewProps) {
    const [platform, setPlatform] = useState<Platform>("ig_feed");

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
            <div className="flex flex-col items-center gap-4 max-w-full" onClick={(e) => e.stopPropagation()}>

                {/* Platform selector */}
                <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-2 py-1.5">
                    {PLATFORMS.map((p) => (
                        <button key={p.id} onClick={() => setPlatform(p.id)}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                platform === p.id
                                    ? "bg-violet-500 text-white"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Mockup frame */}
                <div className="relative">
                    {platform === "ig_feed" && <IGFeedMockup src={src} brandName={brandName} />}
                    {platform === "ig_story" && <IGStoryMockup src={src} brandName={brandName} />}
                    {platform === "fb_feed" && <FBFeedMockup src={src} brandName={brandName} />}
                    {platform === "tt_feed" && <TikTokMockup src={src} brandName={brandName} />}
                </div>

                {/* Close */}
                <button onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-card/90 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cerrar preview
                </button>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/* Instagram Feed Mockup                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function IGFeedMockup({ src, brandName }: { src: string; brandName: string }) {
    return (
        <div className="w-[375px] bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <span className="text-[8px] font-bold text-gray-800">{brandName.charAt(0).toUpperCase()}</span>
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-900">{brandName}</p>
                    <p className="text-[11px] text-gray-500">Sponsored</p>
                </div>
                <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </div>

            {/* Image */}
            <div className="aspect-square bg-gray-100">
                <img src={src} alt="Preview" className="w-full h-full object-cover" />
            </div>

            {/* Actions */}
            <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </div>
                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
                <p className="text-[13px] text-gray-900"><span className="font-semibold">{brandName}</span> Your ad copy goes here ✨</p>
                <button className="w-full py-2 bg-[#0095f6] text-white text-[13px] font-semibold rounded-lg">
                    Shop Now
                </button>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/* Instagram Story Mockup                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function IGStoryMockup({ src, brandName }: { src: string; brandName: string }) {
    return (
        <div className="w-[300px] h-[533px] bg-black rounded-[2rem] overflow-hidden shadow-2xl relative">
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3">
                <div className="h-[3px] bg-white/30 rounded-full mb-3">
                    <div className="h-full w-1/3 bg-white rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                            <span className="text-[7px] font-bold text-white">{brandName.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <span className="text-xs font-semibold text-white">{brandName}</span>
                    <span className="text-[10px] text-white/60">Sponsored</span>
                </div>
            </div>

            {/* Image */}
            <img src={src} alt="Preview" className="w-full h-full object-cover" />

            {/* Swipe up */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 text-center">
                <button className="px-6 py-2 bg-white text-gray-900 text-xs font-semibold rounded-full">
                    Shop Now
                </button>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/* Facebook Feed Mockup                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FBFeedMockup({ src, brandName }: { src: string; brandName: string }) {
    return (
        <div className="w-[375px] bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{brandName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                    <p className="text-[14px] font-semibold text-gray-900">{brandName}</p>
                    <p className="text-[12px] text-gray-500">Sponsored · 🌐</p>
                </div>
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </div>

            {/* Copy */}
            <p className="px-4 pb-2 text-[14px] text-gray-900">Your ad copy goes here. Highlight your product benefits and drive action ✨</p>

            {/* Image */}
            <div className="aspect-[4/5] bg-gray-100">
                <img src={src} alt="Preview" className="w-full h-full object-cover" />
            </div>

            {/* CTA */}
            <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-gray-500 uppercase">yourwebsite.com</p>
                        <p className="text-[14px] font-semibold text-gray-900">Shop Now — Limited Offer</p>
                    </div>
                    <button className="px-4 py-2 bg-[#1877f2] text-white text-[13px] font-semibold rounded-md">
                        Shop Now
                    </button>
                </div>
            </div>

            {/* Reactions */}
            <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-around">
                <span className="text-[13px] text-gray-500 font-medium">👍 Like</span>
                <span className="text-[13px] text-gray-500 font-medium">💬 Comment</span>
                <span className="text-[13px] text-gray-500 font-medium">↗️ Share</span>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/* TikTok Feed Mockup                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TikTokMockup({ src, brandName }: { src: string; brandName: string }) {
    return (
        <div className="w-[300px] h-[533px] bg-black rounded-[2rem] overflow-hidden shadow-2xl relative">
            {/* Image */}
            <img src={src} alt="Preview" className="w-full h-full object-cover" />

            {/* Right sidebar */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    </div>
                    <span className="text-[10px] text-white font-semibold">4.2K</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <span className="text-[10px] text-white font-semibold">128</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                    </div>
                    <span className="text-[10px] text-white font-semibold">56</span>
                </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-white">@{brandName}</span>
                    <span className="px-2 py-0.5 bg-[#fe2c55] text-white text-[9px] font-bold rounded">Ad</span>
                </div>
                <p className="text-xs text-white/90 mb-3">Your product description goes here ✨ #ecommerce #ad</p>
                <button className="w-full py-2 bg-[#fe2c55] text-white text-xs font-bold rounded-md">
                    Shop Now
                </button>
            </div>
        </div>
    );
}