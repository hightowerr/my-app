import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, History, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Screenshot Compare
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compare screenshots and get AI-powered insights. Perfect for tracking competitor changes, A/B tests, and product demos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Upload className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
                <Badge variant="secondary">Core</Badge>
              </div>
              <CardTitle>Upload & Compare</CardTitle>
              <CardDescription>
                Drop two screenshots and get instant visual comparisons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                  Drag & drop interface
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                  Supports PNG, JPG up to 10MB
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Zap className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
                <Badge variant="secondary">AI-Powered</Badge>
              </div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Get ≤5 key changes plus &ldquo;so what&rdquo; implications automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                  GPT-4o vision analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                  Product psychology insights
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-start justify-between">
                <History className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
                <Badge variant="secondary">Timeline</Badge>
              </div>
              <CardTitle>History</CardTitle>
              <CardDescription>
                Track all your comparisons with simple feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                  Track changes over time
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                  Rate report quality
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Upload Screenshots
            </Link>
          </Button>

          <Button variant="outline" asChild size="lg" className="w-full sm:w-auto">
            <Link href="/history">
              <History className="mr-2 h-4 w-4" aria-hidden="true" />
              View History
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
