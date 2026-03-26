"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

interface ProgressToastProps {
    id: string;
    message: string;
    pct: number;
    detail?: string;
}

export function showProgressToast({ id, message, pct, detail }: ProgressToastProps) {
    toast.custom(
        (t) => (
            <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
                    } max-w-xs w-full bg-card border border-border shadow-xl rounded-xl pointer-events-auto`}
            >
                <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground truncate">{message}</span>
                        <span className="text-xs text-violet-400 font-semibold shrink-0 ml-2">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    {detail && <p className="text-[10px] text-muted-foreground">{detail}</p>}
                </div>
            </div>
        ),
        { id, duration: Infinity, position: "bottom-right" },
    );
}

export function dismissProgressToast(id: string) {
    toast.dismiss(id);
}