"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Plus, ChevronLeft, ChevronRight, History, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineComparison } from "@/lib/types";
import { TimelineStorage } from "@/lib/timeline-storage";

export default function TimelinePage() {
  const params = useParams();
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);

  useEffect(() => {
    const timelineId = params.id as string;
    const loadedTimeline = TimelineStorage.getTimeline(timelineId);

    if (loadedTimeline) {
      setTimeline(loadedTimeline);
      // Default to the most recent screenshot (last in the array)
      setSelectedScreenshotIndex(loadedTimeline.screenshots.length - 1);
    } else {
      router.push('/history');
    }
    setLoading(false);
  }, [params.id, router]);

  const handleAddScreenshot = () => {
    console.log('[TIMELINE] Navigate to upload. Params.id:', params.id, 'Type:', typeof params.id);
    const uploadUrl = `/upload?timelineId=${params.id}`;
    console.log('[TIMELINE] Constructed upload URL:', uploadUrl);
    router.push(uploadUrl);
  };

  const getCurrentReport = () => {
    if (!timeline || selectedScreenshotIndex === 0) return null;

    const currentScreenshot = timeline.screenshots[selectedScreenshotIndex];
    return timeline.reports.find(report =>
      report.toScreenshotId === currentScreenshot.id
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Timeline not found</h1>
          <Button asChild>
            <Link href="/history">Back to History</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentScreenshot = timeline.screenshots[selectedScreenshotIndex];
  const currentReport = getCurrentReport();

  // Handle both full data URLs and base64-only data for main screenshot
  const mainImageSrc = currentScreenshot.data.startsWith('data:')
    ? currentScreenshot.data
    : `data:${currentScreenshot.type};base64,${currentScreenshot.data}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Link>
          </Button>

          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {timeline.title || 'Timeline Comparison'}
              </h1>
              <p className="text-muted-foreground">
                {timeline.screenshots.length} screenshots • Created {new Date(timeline.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={handleAddScreenshot}>
              <Plus className="mr-2 h-4 w-4" />
              Add Screenshot
            </Button>
          </div>
        </div>

        {/* Timeline Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline Navigation
            </CardTitle>
            <CardDescription>
              Click any screenshot to view it and its comparison report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {timeline.screenshots.map((screenshot, index) => {
                // Debug: log the first 100 chars of screenshot data
                console.log(`[DEBUG] Screenshot ${index + 1} data prefix:`, screenshot.data.substring(0, 100));
                console.log(`[DEBUG] Screenshot ${index + 1} type:`, screenshot.type);
                console.log(`[DEBUG] Screenshot ${index + 1} starts with data:`, screenshot.data.startsWith('data:'));

                // Handle both full data URLs and base64-only data
                const imageSrc = screenshot.data.startsWith('data:')
                  ? screenshot.data
                  : `data:${screenshot.type};base64,${screenshot.data}`;

                console.log(`[DEBUG] Screenshot ${index + 1} final src:`, imageSrc.substring(0, 100));

                return (
                <div
                  key={screenshot.id}
                  className={cn(
                    "flex-shrink-0 cursor-pointer transition-all duration-200",
                    selectedScreenshotIndex === index && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedScreenshotIndex(index)}
                >
                  <div className="relative">
                    <img
                      src={imageSrc}
                      alt={`Screenshot ${index + 1}`}
                      className="w-32 h-20 object-cover rounded border"
                    />
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <p className="text-xs text-center mt-3 max-w-32 truncate">
                    {screenshot.name}
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    {new Date(screenshot.timestamp).toLocaleDateString()}
                  </p>
                </div>
              );
              })}
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedScreenshotIndex === 0}
                onClick={() => setSelectedScreenshotIndex(prev => Math.max(0, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedScreenshotIndex === timeline.screenshots.length - 1}
                onClick={() => setSelectedScreenshotIndex(prev => Math.min(timeline.screenshots.length - 1, prev + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Screenshot Display */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              Screenshot {selectedScreenshotIndex + 1}: {currentScreenshot.name}
            </CardTitle>
            <CardDescription>
              {new Date(currentScreenshot.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <img
              src={mainImageSrc}
              alt={`Screenshot ${selectedScreenshotIndex + 1}`}
              className="w-full max-w-4xl mx-auto rounded-lg border"
            />
          </CardContent>
        </Card>

        {/* Comparison Report */}
        {currentReport && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {currentReport.type === 'initial' ? 'Initial Comparison' : 'Changes from Previous'}
              </CardTitle>
              <CardDescription>
                AI-generated analysis • {new Date(currentReport.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Changes:</h3>
                <ul className="space-y-2">
                  {currentReport.changes.map((change, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">So What?</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {currentReport.implication}
                </p>
              </div>

              {currentReport.strategicView && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Strategic View</h3>
                  <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    {currentReport.strategicView}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button onClick={handleAddScreenshot}>
            <Upload className="mr-2 h-4 w-4" />
            Add Next Screenshot
          </Button>
          <Button variant="outline" asChild>
            <Link href="/history">
              <History className="mr-2 h-4 w-4" />
              View All Timelines
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}