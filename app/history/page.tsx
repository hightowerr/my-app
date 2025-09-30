"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Eye, ThumbsUp, ThumbsDown, Clock, Play } from "lucide-react";

import { StorageItem, isTimelineComparison, isComparisonResult } from "@/lib/types";
import { TimelineStorage } from "@/lib/timeline-storage";

export default function HistoryPage() {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = () => {
      const allItems = TimelineStorage.getAllStorageItems();
      setItems(allItems);
      setLoading(false);
    };

    loadItems();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

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

          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Comparison History
            </h1>
            <Button asChild>
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" />
                New Comparison
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground">
            View all your previous screenshot comparisons and reports.
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No comparisons yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first set of screenshots to get started.
              </p>
              <Button asChild>
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Screenshots
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {items.map((item) => {
              if (isTimelineComparison(item)) {
                return (
                  <Card key={item.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            {item.title || 'Timeline Comparison'}
                          </CardTitle>
                          <CardDescription>
                            {item.screenshots.length} screenshots • Last updated {new Date(item.updatedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm">
                            <Link href={`/timeline/${item.id}`}>
                              <Play className="mr-2 h-4 w-4" />
                              View Timeline
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        {/* Timeline thumbnails */}
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground mb-2">Screenshots</p>
                          <div className="flex gap-1 overflow-x-auto">
                            {item.screenshots.slice(0, 4).map((screenshot, index) => {
                              const imageSrc = screenshot.data.startsWith('data:')
                                ? screenshot.data
                                : `data:${screenshot.type};base64,${screenshot.data}`;
                              return (
                              <img
                                key={screenshot.id}
                                src={imageSrc}
                                alt={`Screenshot ${index + 1}`}
                                className="w-12 h-8 object-cover rounded border flex-shrink-0"
                              />
                            );})}
                            {item.screenshots.length > 4 && (
                              <div className="w-12 h-8 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                                +{item.screenshots.length - 4}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Latest changes */}
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium mb-2">Latest changes:</p>
                          <p className="text-sm text-muted-foreground">
                            {item.reports.length > 0
                              ? item.reports[item.reports.length - 1].changes[0] || 'No changes detected'
                              : 'No reports yet'
                            }
                          </p>
                          {item.reports.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {item.reports.length} reports total
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              if (isComparisonResult(item)) {
                return (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {new Date(item.timestamp).toLocaleDateString()} at{' '}
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </CardTitle>
                          <CardDescription>
                            {item.imageA.name} vs {item.imageB.name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.feedback && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              {item.feedback === 'useful' ? (
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <ThumbsDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          )}
                          <Button asChild size="sm">
                            <Link href={`/report/${item.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Report
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Thumbnail images */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Before</p>
                            <img
                              src={item.imageA.data.startsWith('data:') ? item.imageA.data : `data:${item.imageA.type};base64,${item.imageA.data}`}
                              alt="Screenshot A thumbnail"
                              className="w-full h-20 object-cover rounded border"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">After</p>
                            <img
                              src={item.imageB.data.startsWith('data:') ? item.imageB.data : `data:${item.imageB.type};base64,${item.imageB.data}`}
                              alt="Screenshot B thumbnail"
                              className="w-full h-20 object-cover rounded border"
                            />
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium mb-2">First change detected:</p>
                          <p className="text-sm text-muted-foreground">
                            {item.comparison.changes[0] || 'No changes detected'}
                          </p>

                          {item.comparison.changes.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              +{item.comparison.changes.length - 1} more changes
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}