import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { generateImage } from "../lib/gemini";
import { Loader2, Image as ImageIcon, KeyRound, Download } from "lucide-react";
import { PaywallModal } from "./PaywallModal";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1K" | "2K" | "4K">("1K");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    try {
      const url = await generateImage(prompt, size);
      setImageUrl(url);
    } catch (error: any) {
      console.error("Image generation error:", error);
      if (error.message === "UPGRADE_REQUIRED") {
        setShowPaywall(true);
      } else if (error.message === "QUOTA_EXCEEDED") {
        alert(
          "Gemini API quota exceeded. Enable billing or upgrade your plan in Google AI Studio, then try again."
        );
      } else {
        alert("Failed to generate image. Check console for details.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Image Studio</h2>
        <p className="text-muted-foreground mt-1">Generate high-quality visuals for your LinkedIn posts.</p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="image-prompt">Image Prompt</Label>
            <Input 
              id="image-prompt" 
              placeholder="e.g., A futuristic office with holographic displays, cinematic lighting" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-size">Resolution</Label>
            <Select value={size} onValueChange={(v: any) => setSize(v)} disabled={isGenerating}>
              <SelectTrigger id="image-size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1K">1K (Standard)</SelectItem>
                <SelectItem value="2K">2K (High)</SelectItem>
                <SelectItem value="4K">4K (Ultra)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleGenerate} 
          disabled={!prompt || isGenerating}
          className="w-full md:w-auto"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="mr-2 h-4 w-4" />}
          Generate Image
        </Button>

        {imageUrl && (
          <div className="mt-8 space-y-4 border rounded-lg p-4 bg-muted/20">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Generated Image</h3>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  const response = await fetch(imageUrl);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'post-image.png';
                  link.click();
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  console.error("Download failed", e);
                  // Fallback to direct link
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = 'post-image.png';
                  link.click();
                }
              }}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
            <img 
              src={imageUrl} 
              alt="Generated" 
              className="w-full h-auto rounded-md shadow-sm"
            />
          </div>
        )}
      </div>
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
