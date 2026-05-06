import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon } from "lucide-react";

interface Props {
  title: string;
  author: string;
  cover: string;
  lang: "bn" | "en" | "ar";
}

export const PhotoCardGenerator = ({ title, author, cover, lang }: Props) => {
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const fontFamily = lang === "ar" ? "Amiri, serif" : lang === "en" ? "Cormorant Garamond, serif" : "Noto Serif Bengali, serif";

  const generate = async (download = false) => {
    setGenerating(true);
    const canvas = previewRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = 1080, H = 1350;
    canvas.width = W; canvas.height = H;

    // background
    ctx.fillStyle = "hsl(40, 38%, 96%)";
    ctx.fillRect(0, 0, W, H);

    // load cover image
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = cover;
    });

    if (img.width) {
      // top half image
      const ih = 720;
      const ratio = Math.max(W / img.width, ih / img.height);
      const w = img.width * ratio, h = img.height * ratio;
      ctx.drawImage(img, (W - w) / 2, (ih - h) / 2, w, h);
      // overlay tint
      ctx.fillStyle = "hsla(25, 25%, 14%, 0.15)";
      ctx.fillRect(0, 0, W, ih);
    }

    // bottom paper area
    ctx.fillStyle = "hsl(40, 38%, 96%)";
    ctx.fillRect(0, 720, W, H - 720);

    // ornamental line
    ctx.strokeStyle = "hsl(14, 60%, 48%)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 40, 780);
    ctx.lineTo(W / 2 + 40, 780);
    ctx.stroke();

    // category label
    ctx.fillStyle = "hsl(14, 60%, 48%)";
    ctx.font = "500 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("◆ কিস্তি · kiSti", W / 2, 830);

    // title (wrap)
    ctx.fillStyle = "hsl(25, 25%, 14%)";
    ctx.font = `600 64px ${fontFamily}`;
    const words = title.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > W - 160) {
        if (cur) lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    let y = 920;
    lines.slice(0, 4).forEach((ln) => { ctx.fillText(ln, W / 2, y); y += 80; });

    // author
    ctx.fillStyle = "hsl(25, 12%, 38%)";
    ctx.font = "italic 32px Cormorant Garamond, serif";
    ctx.fillText(`— ${author}`, W / 2, H - 120);

    // footer
    ctx.fillStyle = "hsl(25, 12%, 50%)";
    ctx.font = "500 18px Inter, sans-serif";
    ctx.fillText("কিস্তি · kiSti — A multilingual literary journal", W / 2, H - 60);

    setGenerating(false);
    if (download) {
      const link = document.createElement("a");
      link.download = `kisti-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
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
          <Button variant="outline" size="sm" onClick={() => generate(false)} disabled={generating}>
            <ImageIcon className="w-4 h-4 mr-2" /> Preview
          </Button>
          <Button size="sm" onClick={() => generate(true)} disabled={generating} className="bg-foreground text-background hover:bg-foreground/90 rounded-none">
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        </div>
      </div>
      <div className="bg-paper-deep p-4 border border-border">
        <canvas ref={previewRef} className="w-full max-w-sm mx-auto block shadow-deep" style={{ aspectRatio: "1080/1350" }} />
      </div>
    </section>
  );
};
