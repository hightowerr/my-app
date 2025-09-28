"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Eye, ThumbsUp, ThumbsDown } from "lucide-react";

interface ComparisonResult {
  id: string;
  imageA: {
    name: string;
    data: string;
    type: string;
  };
  imageB: {
    name: string;
    data: string;
    type: string;
  };
  comparison: {
    changes: string[];
    implication: string;
  };
  timestamp: string;
  feedback?: 'useful' | 'not-useful';
}

export default function HistoryPage() {
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all comparisons from localStorage
    const loadComparisons = () => {
      const allKeys = Object.keys(localStorage);
      const comparisonKeys = allKeys.filter(key => key.startsWith('comparison-'));

      const loadedComparisons = comparisonKeys
        .map(key => {
          try {
            return JSON.parse(localStorage.getItem(key) || '');
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setComparisons(loadedComparisons);
      setLoading(false);
    };

    loadComparisons();
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

        {comparisons.length === 0 ? (
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
            {comparisons.map((comparison) => (
              <Card key={comparison.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {new Date(comparison.timestamp).toLocaleDateString()} at{' '}
                        {new Date(comparison.timestamp).toLocaleTimeString()}
                      </CardTitle>
                      <CardDescription>
                        {comparison.imageA.name} vs {comparison.imageB.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {comparison.feedback && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {comparison.feedback === 'useful' ? (
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      )}
                      <Button asChild size="sm">
                        <Link href={`/report/${comparison.id}`}>
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
                          src={`data:${comparison.imageA.type};base64,${comparison.imageA.data}`}
                          alt="Screenshot A thumbnail"
                          className="w-full h-20 object-cover rounded border"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">After</p>
                        <img
                          src={`data:${comparison.imageB.type};base64,${comparison.imageB.data}`}
                          alt="Screenshot B thumbnail"
                          className="w-full h-20 object-cover rounded border"
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium mb-2">First change detected:</p>
                      <p className="text-sm text-muted-foreground">
                        {comparison.comparison.changes[0] || 'No changes detected'}
                      </p>

                      {comparison.comparison.changes.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{comparison.comparison.changes.length - 1} more changes
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}