"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon } from "lucide-react";

interface Props {
  title: string;
  author: string;
  cover: string;
  lang: "bn" | "en" | "ar";
  date?: string | null;
  categoryBn?: string | null;
}

export const PhotoCardGenerator = ({ title, author, cover, lang, date, categoryBn }: Props) => {
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const fontFamily = lang === "ar" ? "Amiri, serif" : lang === "en" ? "Cormorant Garamond, serif" : "Noto Serif Bengali, serif";

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) => {
    ctx.font = font;
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxWidth) {
        if (cur) lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const generate = async (download = false) => {
    setGenerating(true);
    const canvas = previewRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;

    let hasCover = false;
    if (cover) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        img.onload = () => { hasCover = true; resolve(); };
        img.onerror = () => { hasCover = false; resolve(); };
        img.src = cover;
      });

      if (hasCover && img.width) {
        const ratio = Math.max(W / img.width, H / img.height);
        const w = img.width * ratio, h = img.height * ratio;
        ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      }
    }

    if (!hasCover) {
      // Draw rich dark navy paper background
      ctx.fillStyle = "#0B1528";
      ctx.fillRect(0, 0, W, H);

      // Radial gold ambient glow in center behind logo
      const ambientGrad = ctx.createRadialGradient(W / 2, 280, 20, W / 2, 280, 400);
      ambientGrad.addColorStop(0, "rgba(201, 168, 76, 0.18)");
      ambientGrad.addColorStop(0.5, "rgba(201, 168, 76, 0.06)");
      ambientGrad.addColorStop(1, "rgba(11, 21, 40, 0)");
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, W, H);

      // Abstract golden line texture
      ctx.strokeStyle = "rgba(201, 168, 76, 0.07)";
      ctx.lineWidth = 1;
      for (let i = -W; i < W * 2; i += 36) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
      }

      // Draw kishti logo emblem (/kishti logo.png) in top center
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
        logoImg.src = "/kishti%20logo.png";
      });

      if (logoImg.width) {
        const logoW = 280;
        const logoH = (logoImg.height / logoImg.width) * logoW;
        ctx.drawImage(logoImg, (W - logoW) / 2, 140, logoW, logoH);
      }
    }

    const grad = ctx.createLinearGradient(0, H * 0.25, 0, H);
    grad.addColorStop(0, "rgba(15, 12, 10, 0)");
    grad.addColorStop(0.45, "rgba(15, 12, 10, 0.55)");
    grad.addColorStop(0.7, "rgba(15, 12, 10, 0.82)");
    grad.addColorStop(1, "rgba(15, 12, 10, 0.95)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const topGrad = ctx.createLinearGradient(0, 0, 0, 160);
    topGrad.addColorStop(0, "rgba(15, 12, 10, 0.6)");
    topGrad.addColorStop(1, "rgba(15, 12, 10, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 160);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "600 28px 'Noto Serif Bengali', serif";
    ctx.fillText("কিস্তি", 60, 70);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "italic 18px 'Inter', sans-serif";
    ctx.fillText("kiSti", 170, 70);

    if (categoryBn) {
      ctx.textAlign = "right";
      ctx.fillStyle = "hsl(14, 60%, 48%)";
      ctx.font = "500 22px 'Noto Serif Bengali', serif";
      ctx.fillText(categoryBn, W - 60, 70);
    }

    const titleFont = `700 ${title.length > 40 ? "52" : "60"}px ${fontFamily}`;
    const titleLines = wrapText(ctx, title, W - 120, titleFont);
    ctx.font = titleFont;
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";

    const lineHeight = title.length > 40 ? 68 : 78;
    const totalTitleHeight = Math.min(titleLines.length, 4) * lineHeight;
    const titleStartY = H - 200 - totalTitleHeight;

    titleLines.slice(0, 4).forEach((ln, i) => {
      ctx.fillText(ln, 60, titleStartY + i * lineHeight);
    });

    const lineY = H - 180;
    ctx.strokeStyle = "hsl(14, 60%, 48%)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, lineY);
    ctx.lineTo(180, lineY);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `500 24px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.fillText(author, 60, H - 140);

    if (date) {
      const dateStr = new Date(date).toLocaleDateString("bn-BD", {
        year: "numeric", month: "long", day: "numeric"
      });
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "400 20px 'Noto Serif Bengali', serif";
      ctx.fillText(dateStr, 60, H - 105);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "500 16px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("কিস্তি · kiSti  —  রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র", W / 2, H - 30);

    setGenerating(false);

    if (download) {
      const link = document.createElement("a");
      link.download = `kisti-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handlePreview = async () => {
    setShowPreview(true);
    requestAnimationFrame(() => {
      generate(false);
    });
  };

  const handleDownload = async () => {
    if (!showPreview) {
      setShowPreview(true);
      requestAnimationFrame(() => {
        generate(true);
      });
    } else {
      generate(true);
    }
  };

  return (
    <section className="mt-16 pt-8 border-t border-border/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-en-sans uppercase text-[10px] tracking-[0.3em] text-accent mb-1">◆ Share</div>
          <h3 className="font-bn text-xl">ফটো কার্ড</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview} disabled={generating}>
            <ImageIcon className="w-4 h-4 mr-2" /> Preview
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={generating} className="bg-foreground text-background hover:bg-foreground/90 rounded-none">
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-paper-deep p-4 border border-border animate-fade-up">
          <canvas ref={previewRef} className="w-full max-w-md mx-auto block shadow-deep rounded-sm" style={{ aspectRatio: "1/1" }} />
        </div>
      )}
    </section>
  );
};
