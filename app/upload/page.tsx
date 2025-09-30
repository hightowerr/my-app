"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Loader2, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineComparison } from "@/lib/types";
import { TimelineStorage } from "@/lib/timeline-storage";

// Development flag for conditional logging
const isDev = process.env.NODE_ENV === 'development';

export default function UploadPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });
  const [files, setFiles] = useState<{ a: File | null; b: File | null }>({ a: null, b: null });
  const [previews, setPreviews] = useState<{ a: string | null; b: string | null }>({ a: null, b: null });
  const [isComparing, setIsComparing] = useState(false);
  const [timeline, setTimeline] = useState<TimelineComparison | null>(null);
  const [isTimelineMode, setIsTimelineMode] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const searchParams = useSearchParams();

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

  useEffect(() => {
    if (isDev) {
      console.log('[UPLOAD] useEffect triggered. Search params:', Object.fromEntries(searchParams.entries()));
    }
    const timelineId = searchParams.get('timelineId');
    if (isDev) {
      console.log('[UPLOAD] Timeline ID from URL:', timelineId, 'Type:', typeof timelineId);
    }

    if (timelineId) {
      if (isDev) {
        console.log('[UPLOAD] Attempting to load timeline with ID:', timelineId);
      }
      const loadedTimeline = TimelineStorage.getTimeline(timelineId);
      if (isDev) {
        console.log('[UPLOAD] Loaded timeline:', loadedTimeline ? {
          id: loadedTimeline.id,
          screenshotCount: loadedTimeline.screenshots?.length,
          reportsCount: loadedTimeline.reports?.length,
          type: typeof loadedTimeline,
          isArray: Array.isArray(loadedTimeline)
        } : 'null');
      }

      if (loadedTimeline) {
        setTimeline(loadedTimeline);
        setIsTimelineMode(true);
        if (isDev) {
          console.log('[UPLOAD] ✓ Timeline mode activated');
        }
      } else {
        if (isDev) {
          console.error('[UPLOAD] ✗ Failed to load timeline with ID:', timelineId);
        }
      }
    } else {
      if (isDev) {
        console.log('[UPLOAD] No timeline ID in URL, using regular comparison mode');
      }
    }
  }, [searchParams]);

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
      if (isDev) {
        console.error('Error comparing images:', error);
      }
      alert('Failed to compare images. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleAddToTimeline = async () => {
    if (isDev) {
      console.log('[ADD_TO_TIMELINE] Function called. Timeline:', timeline ? {
        id: timeline.id,
        type: typeof timeline,
        isArray: Array.isArray(timeline),
        hasId: 'id' in timeline,
        idValue: timeline.id,
        idType: typeof timeline.id
      } : 'null');
    }
    if (isDev) {
      console.log('[ADD_TO_TIMELINE] File A:', files.a ? { name: files.a.name, size: files.a.size } : 'null');
    }

    if (!timeline || !files.a) {
      if (isDev) {
        console.error('[ADD_TO_TIMELINE] Missing required data. Timeline:', !!timeline, 'File:', !!files.a);
      }
      return;
    }

    if (isDev) {
      console.log('[ADD_TO_TIMELINE] Starting timeline addition process...');
    }
    setIsComparing(true);
    setProgressStatus('Preparing image...');

    // Create AbortController for timeout handling
    const controller = new AbortController();
    setAbortController(controller);

    // Warning at 30s mark
    const warningId = setTimeout(() => {
      if (isDev) {
        console.log('[TIMING] 30 seconds elapsed - AI processing is taking longer than expected');
      }
      setProgressStatus('Still processing... Large images may take up to 60 seconds');
    }, 30000);

    const timeoutId = setTimeout(() => {
      if (isDev) {
        console.log('[TIMING] Timeline addition timed out after 90 seconds, aborting request');
      }
      setProgressStatus('Request timed out, cancelling...');
      controller.abort();
    }, 90000); // 90 second timeout for large images and AI processing

    try {
      setProgressStatus('Preparing image data...');
      if (isDev) {
        console.log('Preparing image data...');
        console.log('[TIMING] Image file size:', (files.a.size / 1024 / 1024).toFixed(2), 'MB', '| Type:', files.a.type);
      }

      // Convert file to base64
      const reader = new FileReader();
      const imageBase64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        if (files.a) {
          reader.readAsDataURL(files.a);
        } else {
          reject(new Error('No file selected'));
        }
      });

      const imageDataUrl = await imageBase64Promise;
      if (isDev) {
        console.log('[TIMING] Image converted to base64');
      }

      const lastScreenshot = timeline.screenshots[timeline.screenshots.length - 1];

      // Normalize screenshot data - it might already have the data URL prefix
      let previousImageDataUrl: string;
      if (lastScreenshot.data.startsWith('data:')) {
        // Already has data URL prefix, use as-is
        previousImageDataUrl = lastScreenshot.data;
        if (isDev) {
          console.log('[TIMING] Previous screenshot already has data URL prefix');
        }
      } else {
        // Raw base64, add prefix
        previousImageDataUrl = `data:${lastScreenshot.type};base64,${lastScreenshot.data}`;
        if (isDev) {
          console.log('[TIMING] Previous screenshot is raw base64, adding prefix');
        }
      }

      if (isDev) {
        console.log('[TIMING] Previous screenshot size:', (previousImageDataUrl.length / 1024 / 1024).toFixed(2), 'MB');
      }

      const previousChanges = timeline.reports
        .filter(r => r.type === 'continuation')
        .map(r => r.changes.join(', '))
        .join(' | ');
      const context = `Previous changes in timeline: ${previousChanges || 'Initial comparison'}`;

      const payload = {
        imageName: files.a.name,
        imageType: files.a.type,
        imageData: imageDataUrl,
        previousImageData: previousImageDataUrl,
        previousScreenshotId: lastScreenshot.id,
        previousContext: context
      };

      const payloadString = JSON.stringify(payload);
      const payloadSizeMB = (payloadString.length / 1024 / 1024).toFixed(2);
      if (isDev) {
        console.log('[TIMING] Total JSON payload size:', payloadSizeMB, 'MB');
        console.log('[VALIDATION] Payload breakdown:', {
          imageDataSizeMB: (imageDataUrl.length / 1024 / 1024).toFixed(2),
          previousImageSizeMB: (previousImageDataUrl.length / 1024 / 1024).toFixed(2),
          totalPayloadSizeMB: payloadSizeMB,
          exceedsLimit: parseFloat(payloadSizeMB) > 4
        });
      }

      if (parseFloat(payloadSizeMB) > 4) {
        if (isDev) {
          console.error('[ERROR] Payload exceeds Next.js 4MB limit!');
        }
        throw new Error('Images are too large. Please use smaller images (the combined size exceeds 4MB).');
      }

      setProgressStatus('Analyzing images with AI...');
      const apiUrl = `/api/timeline/${timeline.id}/add`;
      if (isDev) {
        console.log('[ADD_TO_TIMELINE] Constructed API URL:', apiUrl);
        console.log('[ADD_TO_TIMELINE] Timeline ID used:', timeline.id, 'Type:', typeof timeline.id);
        console.log('[ADD_TO_TIMELINE] Sending request to API...');
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      // Clear the timeouts since request completed
      clearTimeout(warningId);
      clearTimeout(timeoutId);

      if (isDev) {
        console.log('[ADD_TO_TIMELINE] Response received. Status:', response.status, response.statusText);
      }

      if (response.ok) {
        setProgressStatus('Processing AI results...');
        if (isDev) {
          console.log('[ADD_TO_TIMELINE] API request successful, processing response...');
        }
        const result = await response.json();

        setProgressStatus('Saving to timeline...');
        if (isDev) {
          console.log('Adding screenshot to timeline storage...');
          console.log('[DEBUG] API result.screenshot:', { name: result.screenshot.name, dataStart: result.screenshot.data?.substring(0, 50) + '...', type: result.screenshot.type, size: result.screenshot.size });
        }

        // Convert raw base64 to data URL format
        const screenshotDataUrl = `data:${result.screenshot.type};base64,${result.screenshot.data}`;

        const updatedTimeline = await TimelineStorage.addScreenshotToTimeline(timeline.id, {
          id: result.screenshot.id,
          name: result.screenshot.name,
          data: screenshotDataUrl,
          type: result.screenshot.type,
          size: result.screenshot.size
        });

        if (updatedTimeline) {
          setProgressStatus('Updating timeline data...');
          if (isDev) {
            console.log('Timeline updated successfully, adding report...');
          }

          // API now returns the correct report structure with fromScreenshotId and toScreenshotId
          updatedTimeline.reports.push(result.report);
          TimelineStorage.saveTimeline(updatedTimeline);

          setProgressStatus('Complete! Redirecting...');
          if (isDev) {
            console.log('Timeline addition completed, navigating to timeline page...');
          }

          // Small delay to show completion message
          setTimeout(() => {
            router.push(`/timeline/${timeline.id}`);
          }, 500);
        } else {
          throw new Error('Failed to update timeline storage');
        }
      } else {
        // Handle API error responses
        if (isDev) {
          console.error('[ADD_TO_TIMELINE] API request failed. Status:', response.status, response.statusText);
        }
        const errorData = await response.json().catch((e) => {
          if (isDev) {
            console.error('[ADD_TO_TIMELINE] Failed to parse error response:', e);
          }
          return { error: 'Unknown error' };
        });
        if (isDev) {
          console.error('[ADD_TO_TIMELINE] Error data:', errorData);
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      // Clear timeouts in case of error
      clearTimeout(warningId);
      clearTimeout(timeoutId);
      if (isDev) {
        console.error('Error adding to timeline:', error);
      }

      let errorMessage = 'Failed to add screenshot to timeline. ';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'The upload took too long and was cancelled. Please try again with a smaller image file or check your internet connection.';
        } else if (error.message.includes('AI analysis took too long')) {
          errorMessage = 'The AI analysis took too long. Please try again with a smaller or simpler image.';
        } else if (error.message.includes('Storage quota exceeded')) {
          errorMessage = 'Storage space is full! Please go to the History page and delete some old comparisons or timelines to free up space, then try again.';
        } else if (error.message.includes('compression')) {
          errorMessage = 'Failed to process the image. Please try uploading a smaller image file.';
        } else if (error.message.includes('temporarily unavailable')) {
          errorMessage = 'The AI service is temporarily unavailable. Please try again in a few moments.';
        } else if (error.message.includes('too large')) {
          errorMessage = 'The image file is too large. Please use an image under 10MB.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
    } finally {
      // Ensure cleanup always happens
      clearTimeout(warningId);
      clearTimeout(timeoutId);
      setIsComparing(false);
      setProgressStatus('');
      setAbortController(null);
    }
  };

  const handleCancelAddToTimeline = () => {
    if (abortController) {
      if (isDev) {
        console.log('User cancelled timeline addition');
      }
      setProgressStatus('Cancelling...');
      abortController.abort();
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
            {isTimelineMode ? 'Add to Timeline' : 'Upload Screenshots'}
          </h1>
          <p className="text-muted-foreground">
            {isTimelineMode
              ? `Add the next screenshot to continue the "${timeline?.title || 'Timeline'}" progression.`
              : 'Upload two screenshots to compare them and get AI-powered insights.'
            }
          </p>
        </div>

        {isTimelineMode && timeline ? (
          <>
            {/* Timeline info */}
            <Card className="mb-6 border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  {timeline.title || 'Timeline Comparison'}
                </CardTitle>
                <CardDescription>
                  {timeline.screenshots.length} screenshots • Last updated {new Date(timeline.updatedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto">
                  {timeline.screenshots.slice(-3).map((screenshot, index) => {
                    const imageSrc = screenshot.data.startsWith('data:')
                      ? screenshot.data
                      : `data:${screenshot.type};base64,${screenshot.data}`;
                    return (
                    <div key={screenshot.id} className="flex-shrink-0">
                      <img
                        src={imageSrc}
                        alt={`Screenshot ${index + 1}`}
                        className="w-20 h-12 object-cover rounded border"
                      />
                      <p className="text-xs text-center mt-1 max-w-20 truncate">
                        {screenshot.name}
                      </p>
                    </div>
                  );})}
                  <div className="flex-shrink-0 flex items-center justify-center w-20 h-12 border-2 border-dashed border-primary/50 rounded bg-primary/5">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Single upload for timeline */}
            <div className="mb-8">
              <FileDropzone slot="a" label="Next Screenshot" />
            </div>
          </>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <FileDropzone slot="a" label="Screenshot A (Before)" />
            <FileDropzone slot="b" label="Screenshot B (After)" />
          </div>
        )}

        <div className="text-center">
          {isTimelineMode ? (
            <div className="space-y-4">
              {isComparing && progressStatus && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">{progressStatus}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={handleAddToTimeline}
                  disabled={!files.a || isComparing}
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {progressStatus || 'Adding to Timeline...'}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Timeline
                    </>
                  )}
                </Button>

                {isComparing && abortController && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleCancelAddToTimeline}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}