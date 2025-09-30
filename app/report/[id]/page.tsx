"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ThumbsUp, ThumbsDown, Upload, History, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComparisonResult } from "@/lib/types";
import { TimelineStorage } from "@/lib/timeline-storage";


export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'useful' | 'not-useful' | null>(null);
  const [isCreatingTimeline, setIsCreatingTimeline] = useState(false);

  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll check localStorage or redirect if no data
    const storedResult = localStorage.getItem(`comparison-${params.id}`);
    if (storedResult) {
      const parsed = JSON.parse(storedResult);
      setResult(parsed);
      setFeedback(parsed.feedback || null);
    } else {
      // If no stored result, redirect to upload
      router.push('/upload');
    }
    setLoading(false);
  }, [params.id, router]);

  const handleFeedback = (type: 'useful' | 'not-useful') => {
    if (!result) return;

    const updatedResult = { ...result, feedback: type };
    setResult(updatedResult);
    setFeedback(type);

    // Save to localStorage
    localStorage.setItem(`comparison-${params.id}`, JSON.stringify(updatedResult));

    // In a real app, you'd also send this to your backend
    console.log(`Feedback for ${params.id}: ${type}`);
  };

  const handleCreateTimeline = async () => {
    if (!result) {
      console.error('No comparison result available');
      alert('No comparison data available. Please try refreshing the page.');
      return;
    }

    console.log('Starting timeline creation for comparison:', result.id);
    setIsCreatingTimeline(true);

    try {
      // Validate that we have the minimum required data
      if (!result.id || !result.imageA || !result.imageB) {
        throw new Error('Incomplete comparison data: missing ID or images');
      }

      if (!result.imageA.name || !result.imageA.data || !result.imageB.name || !result.imageB.data) {
        throw new Error('Incomplete image data: missing names or data');
      }

      console.log('Validation passed, creating timeline...');

      const timeline = await TimelineStorage.convertComparisonToTimeline(
        result.id,
        `Timeline from ${result.imageA.name}`
      );

      if (!timeline) {
        throw new Error('Timeline creation failed: convertComparisonToTimeline returned null');
      }

      console.log('Timeline created successfully:', timeline.id);
      console.log('Navigating to timeline page...');

      router.push(`/timeline/${timeline.id}`);
    } catch (error) {
      console.error('Error creating timeline:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to create timeline. ';
      if (error instanceof Error) {
        if (error.message.includes('Storage quota exceeded')) {
          errorMessage = 'Storage space is full! Please go to the History page and delete some old comparisons or timelines to free up space, then try again.';
        } else if (error.message.includes('missing')) {
          errorMessage += 'The comparison data appears to be incomplete. Please try creating a new comparison first.';
        } else if (error.message.includes('localStorage')) {
          errorMessage += 'There was an issue accessing saved data. Please check browser storage permissions.';
        } else if (error.message.includes('compression')) {
          errorMessage += 'Failed to process the images. This comparison might have very large images.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
    } finally {
      setIsCreatingTimeline(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Comparison not found</h1>
          <Button asChild>
            <Link href="/upload">Upload Screenshots</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/upload">
              <ArrowLeft className="mr-2 h-4 w-4" />
              New Comparison
            </Link>
          </Button>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Comparison Report
          </h1>
          <p className="text-muted-foreground">
            {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Side-by-side images */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Screenshot A (Before)</CardTitle>
              <CardDescription>{result.imageA.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <img
                src={result.imageA.data.startsWith('data:') ? result.imageA.data : `data:${result.imageA.type};base64,${result.imageA.data}`}
                alt="Screenshot A"
                className="w-full rounded-lg border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Screenshot B (After)</CardTitle>
              <CardDescription>{result.imageB.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <img
                src={result.imageB.data.startsWith('data:') ? result.imageB.data : `data:${result.imageB.type};base64,${result.imageB.data}`}
                alt="Screenshot B"
                className="w-full rounded-lg border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Change Report */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Key Changes Detected</CardTitle>
            <CardDescription>
              AI-generated analysis of differences between the screenshots
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Changes:</h3>
              <ul className="space-y-2">
                {result.comparison.changes.map((change, index) => (
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
                {result.comparison.implication}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Was this report useful?</CardTitle>
            <CardDescription>
              Your feedback helps us improve the comparison accuracy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={feedback === 'useful' ? 'default' : 'outline'}
                onClick={() => handleFeedback('useful')}
                className={cn(
                  "transition-colors",
                  feedback === 'useful' && "bg-green-600 hover:bg-green-700"
                )}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Useful
              </Button>
              <Button
                variant={feedback === 'not-useful' ? 'default' : 'outline'}
                onClick={() => handleFeedback('not-useful')}
                className={cn(
                  "transition-colors",
                  feedback === 'not-useful' && "bg-red-600 hover:bg-red-700"
                )}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Not Useful
              </Button>
            </div>
            {feedback && (
              <p className="text-sm text-muted-foreground mt-2">
                Thank you for your feedback!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Timeline Creation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Continue This Comparison
            </CardTitle>
            <CardDescription>
              Turn this comparison into a timeline to track changes over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Create Timeline</p>
                <p className="text-sm text-muted-foreground">
                  Start tracking the evolution of this interface by creating a timeline.
                  You can then add more screenshots to see how it changes over time.
                </p>
              </div>
              <Button
                onClick={handleCreateTimeline}
                disabled={isCreatingTimeline}
                className="ml-4"
              >
                {isCreatingTimeline ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Timeline
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              New Comparison
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/history">
              <History className="mr-2 h-4 w-4" />
              View History
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}