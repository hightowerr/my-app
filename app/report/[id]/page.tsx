"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ThumbsUp, ThumbsDown, Upload, History } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'useful' | 'not-useful' | null>(null);

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
                src={`data:${result.imageA.type};base64,${result.imageA.data}`}
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
                src={`data:${result.imageB.type};base64,${result.imageB.data}`}
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