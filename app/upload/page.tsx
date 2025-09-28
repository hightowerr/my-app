"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });
  const [files, setFiles] = useState<{ a: File | null; b: File | null }>({ a: null, b: null });
  const [previews, setPreviews] = useState<{ a: string | null; b: string | null }>({ a: null, b: null });
  const [isComparing, setIsComparing] = useState(false);

  const handleDrag = (e: React.DragEvent, slot: 'a' | 'b') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [slot]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [slot]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, slot: 'a' | 'b') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [slot]: false }));

    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFile = droppedFiles.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleFile(imageFile, slot);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, slot: 'a' | 'b') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file, slot);
    }
  };

  const handleFile = (file: File, slot: 'a' | 'b') => {
    setFiles(prev => ({ ...prev, [slot]: file }));

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews(prev => ({ ...prev, [slot]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (slot: 'a' | 'b') => {
    setFiles(prev => ({ ...prev, [slot]: null }));
    setPreviews(prev => ({ ...prev, [slot]: null }));
  };

  const handleCompare = async () => {
    if (!files.a || !files.b) return;

    setIsComparing(true);

    try {
      const formData = new FormData();
      formData.append('imageA', files.a);
      formData.append('imageB', files.b);

      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        // Store result in localStorage for the report page
        localStorage.setItem(`comparison-${result.id}`, JSON.stringify(result));

        router.push(`/report/${result.id}`);
      } else {
        throw new Error('Comparison failed');
      }
    } catch (error) {
      console.error('Error comparing images:', error);
      alert('Failed to compare images. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  const FileDropzone = ({ slot, label }: { slot: 'a' | 'b'; label: string }) => (
    <Card className={cn(
      "relative transition-colors",
      dragActive[slot] && "border-primary bg-primary/5"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {label}
        </CardTitle>
        <CardDescription>
          Drag and drop an image or click to browse
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!previews[slot] ? (
          <div
            className={cn(
              "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-muted-foreground/50",
              dragActive[slot] && "border-primary bg-primary/5"
            )}
            onDragEnter={(e) => handleDrag(e, slot)}
            onDragLeave={(e) => handleDrag(e, slot)}
            onDragOver={(e) => handleDrag(e, slot)}
            onDrop={(e) => handleDrop(e, slot)}
            onClick={() => document.getElementById(`file-${slot}`)?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drop your screenshot here
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG up to 10MB
            </p>
            <input
              id={`file-${slot}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileInput(e, slot)}
            />
          </div>
        ) : (
          <div className="relative">
            <img
              src={previews[slot]}
              alt={`Preview ${slot}`}
              className="w-full h-48 object-contain rounded-lg border"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => removeFile(slot)}
            >
              <X className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground mt-2 truncate">
              {files[slot]?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Upload Screenshots
          </h1>
          <p className="text-muted-foreground">
            Upload two screenshots to compare them and get AI-powered insights.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <FileDropzone slot="a" label="Screenshot A (Before)" />
          <FileDropzone slot="b" label="Screenshot B (After)" />
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleCompare}
            disabled={!files.a || !files.b || isComparing}
          >
            {isComparing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Compare Screenshots
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}