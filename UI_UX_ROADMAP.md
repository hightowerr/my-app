# UI/UX Enhancement Roadmap

This document outlines the completed Phase 1 improvements and the remaining phases for enhancing the Screenshot Compare App's UI/UX.

---

## ✅ Phase 1: Critical UX Improvements (COMPLETED)

**Status:** All tasks completed
**Completion Date:** 2025-10-11
**Time Investment:** ~4 hours

### Components Installed
- ✅ `sonner` - Modern toast notifications (alternative to toast component)
- ✅ `skeleton` - Loading state components
- ✅ `badge` - Category/status indicators
- ✅ `separator` - Visual hierarchy dividers

### Enhancements Delivered

#### Landing Page (`app/page.tsx`)
- ✅ Added Badge components to feature cards ("Core", "AI-Powered", "Timeline")
- ✅ Added hover effects with `hover:shadow-lg hover:-translate-y-1` animations
- ✅ Expanded CardContent with feature bullet points
- ✅ Improved button layout with responsive flex (stacked mobile, horizontal desktop)
- ✅ All decorative icons marked with `aria-hidden="true"`
- ✅ Feature lists marked with `role="list"`

#### Report Page (`app/report/[id]/page.tsx`)
- ✅ Replaced all `alert()` calls with Sonner toast notifications
- ✅ Toast feedback for successful/failed feedback saves
- ✅ Toast feedback for timeline creation errors
- ✅ Added Separator component between Changes and "So What?" sections
- ✅ Feedback buttons have `aria-pressed` state
- ✅ All decorative icons have `aria-hidden="true"`
- ✅ Changes list has `role="list"`
- ✅ Action buttons have `flex-wrap` for mobile responsiveness

#### History Page (`app/history/page.tsx`)
- ✅ Replaced custom spinner with Skeleton loaders
- ✅ Skeleton structure mimics actual content (3 card skeletons)
- ✅ All decorative icons have `aria-hidden="true"`
- ✅ Feedback indicators have `aria-label` for screen readers

#### Global Layout (`app/layout.tsx`)
- ✅ Added Toaster component from Sonner for app-wide notifications

### Accessibility Improvements
- ✅ All decorative icons marked with `aria-hidden="true"`
- ✅ Interactive elements have proper ARIA attributes (`aria-pressed`, `aria-label`)
- ✅ Lists properly marked with `role="list"`
- ✅ TypeScript compilation passes with no errors

---

## ✅ Phase 2: Enhanced Interactions (COMPLETED)

**Status:** All major tasks completed (except upload page enhancements - deferred to Phase 3)
**Completion Date:** 2025-10-11
**Time Investment:** ~8 hours
**Priority:** HIGH

### Components Installed
```bash
✅ npx shadcn@latest add dialog
✅ npx shadcn@latest add progress (installed but not yet implemented)
✅ npx shadcn@latest add scroll-area
✅ npx shadcn@latest add alert
✅ npx shadcn@latest add accordion
```

### Completed Enhancements

#### 1. **Report Page** (`app/report/[id]/page.tsx`)
- ✅ **Accordion for Psychology Insights**
  - Collapsible insights with expandable rationale
  - Badge indicators for positive/negative outcomes
  - Better organization and reduced visual clutter
  - Improved mobile experience
  - `app/report/[id]/page.tsx:236-263`

- ✅ **Dialog for Image Zoom**
  - Click-to-zoom for both Screenshot A and B
  - Hover overlay with ZoomIn icon indicator
  - Full-screen image viewing (max-w-6xl, max-h-90vh)
  - Escape key to close
  - Professional zoom interaction with transition effects
  - `app/report/[id]/page.tsx:179-216, 379-399`

#### 2. **Timeline Page** (`app/timeline/[id]/page.tsx`)
- ✅ **ScrollArea for Screenshot Navigation**
  - Horizontal scrollbar with scroll indicators
  - Smooth scrolling experience
  - Position counter: "X of Y" display
  - Previous/Next navigation buttons
  - Improved layout with space-between controls
  - `app/timeline/[id]/page.tsx:137-210`

- ✅ **Alert Component for Phase Summaries**
  - Purple-themed alert for summary reports
  - BarChart icon indicator
  - Clear description of summary purpose
  - Enhanced phase title styling (purple-700/purple-300)
  - Visually distinct from regular reports
  - `app/timeline/[id]/page.tsx:248-258, 279-286`

- ✅ **Accessibility Improvements**
  - All decorative icons marked with `aria-hidden="true"`
  - Position counter has `role="status"` and `aria-live="polite"`
  - Better keyboard navigation indication

### Deferred to Phase 3

### Upload Page (`app/upload/page.tsx`)

#### Dialog Component for Image Zoom
**Priority:** HIGH
**Files:** `app/upload/page.tsx`

Add click-to-zoom functionality for uploaded image previews:

```typescript
// Add state
const [previewDialog, setPreviewDialog] = useState<'a' | 'b' | null>(null);

// Wrap thumbnail with click handler
<img
  src={previews[slot]}
  alt={`Preview ${slot}`}
  className="w-full h-48 object-contain rounded-lg border cursor-pointer transition-opacity group-hover:opacity-80"
  onClick={() => setPreviewDialog(slot)}
/>

// Add Dialog component
<Dialog open={previewDialog === slot} onOpenChange={(open) => !open && setPreviewDialog(null)}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>{label} - Full Preview</DialogTitle>
      <DialogDescription>{files[slot]?.name}</DialogDescription>
    </DialogHeader>
    <img
      src={previews[slot] || ''}
      alt={`Full preview ${slot}`}
      className="w-full h-auto"
    />
  </DialogContent>
</Dialog>
```

**Benefits:**
- Users can inspect image details before upload
- Better UX for mobile users
- Professional interaction pattern

#### Progress Component for Upload Status
**Priority:** HIGH
**Files:** `app/upload/page.tsx` (Lines 586-593)

Replace basic loading indicator with Progress component:

```typescript
{isComparing && (
  <Card>
    <CardContent className="pt-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{progressStatus}</span>
          <span className="text-muted-foreground">Processing...</span>
        </div>
        <Progress value={33} className="h-2" aria-label="Upload progress" />
        <p className="text-xs text-muted-foreground text-center">
          This may take up to 60 seconds for large images
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

**Benefits:**
- Clear visual feedback during processing
- Sets user expectations with timeout warning
- Professional loading state

#### AlertDialog for Error Messages
**Priority:** MEDIUM
**Files:** `app/upload/page.tsx` (Lines 140-144, 424)

Replace all `alert()` calls with AlertDialog:

```typescript
const [alertDialog, setAlertDialog] = useState<{open: boolean; title: string; message: string}>({
  open: false,
  title: '',
  message: ''
});

// Replace alert() calls
setAlertDialog({
  open: true,
  title: 'Error',
  message: 'File size too large'
});

// Add AlertDialog component
<AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({...alertDialog, open})}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
      <AlertDialogDescription>{alertDialog.message}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction>OK</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Benefits:**
- Consistent error handling UX
- Styled to match app theme
- Better than native browser alerts

#### Skeleton for Timeline Loading
**Priority:** MEDIUM
**Files:** `app/upload/page.tsx` (Lines 534-569)

Add skeleton while timeline loads from localStorage:

```typescript
{isTimelineMode && !timeline ? (
  <Card className="mb-6">
    <CardHeader>
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent>
      <div className="flex gap-2">
        <Skeleton className="w-20 h-12 rounded" />
        <Skeleton className="w-20 h-12 rounded" />
        <Skeleton className="w-20 h-12 rounded" />
      </div>
    </CardContent>
  </Card>
) : isTimelineMode && timeline ? (
  // ... existing timeline display
)}
```

### Report Page (`app/report/[id]/page.tsx`)

#### Dialog for Image Zoom
**Priority:** HIGH
**Files:** `app/report/[id]/page.tsx` (Lines 163-191)

Add click-to-zoom for comparison images:

```typescript
const [zoomedImage, setZoomedImage] = useState<'a' | 'b' | null>(null);

// Wrap images with click handler
<Card className="group cursor-pointer" onClick={() => setZoomedImage('a')}>
  <CardHeader>
    <CardTitle>Screenshot A (Before)</CardTitle>
    <CardDescription>{result.imageA.name}</CardDescription>
  </CardHeader>
  <CardContent className="relative">
    <img
      src={imageSrc}
      alt="Screenshot A"
      className="w-full rounded-lg border transition-opacity group-hover:opacity-90"
    />
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <div className="bg-black/50 rounded-full p-3">
        <ZoomIn className="h-6 w-6 text-white" />
      </div>
    </div>
  </CardContent>
</Card>

// Add Dialog
<Dialog open={zoomedImage !== null} onOpenChange={(open) => !open && setZoomedImage(null)}>
  <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
    <DialogHeader>
      <DialogTitle>
        {zoomedImage === 'a' ? `Screenshot A - ${result?.imageA.name}` : `Screenshot B - ${result?.imageB.name}`}
      </DialogTitle>
    </DialogHeader>
    <img
      src={/* appropriate image source */}
      alt={`Full view of screenshot ${zoomedImage}`}
      className="w-full h-auto"
    />
  </DialogContent>
</Dialog>
```

**Benefits:**
- Users can examine details of changes
- Essential for mobile users
- Better than opening in new tab

#### Accordion for Psychology Insights
**Priority:** MEDIUM
**Files:** `app/report/[id]/page.tsx` (Lines 221-250)

Collapse psychology insights for better readability:

```typescript
{result.comparison.psychologyInsights && result.comparison.psychologyInsights.length > 0 && (
  <div className="border-t pt-4">
    <h3 className="font-semibold mb-3">Product Psychology Insights</h3>
    <Accordion type="single" collapsible className="w-full">
      {result.comparison.psychologyInsights.map((insight, index) => (
        <AccordionItem key={index} value={`insight-${index}`}>
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">💡</span>
              <span className="font-semibold text-sm">{insight.principle}</span>
              <Badge variant={insight.outcome === 'positive' ? 'default' : 'destructive'}>
                {insight.outcome === 'positive' ? 'Positive' : 'Negative'}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground pl-7">
              {insight.rationale}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
)}
```

**Benefits:**
- Reduces visual clutter
- Users can expand only relevant insights
- Better mobile experience

### Timeline Page (`app/timeline/[id]/page.tsx`)

#### ScrollArea for Screenshot Navigation
**Priority:** HIGH
**Files:** `app/timeline/[id]/page.tsx` (Lines 134-177)

Add better horizontal scroll with indicators:

```typescript
<CardContent>
  <ScrollArea className="w-full whitespace-nowrap">
    <div className="flex gap-4 pb-4">
      {timeline.screenshots.map((screenshot, index) => {
        // ... screenshot thumbnails
      })}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>

  <div className="flex items-center justify-between mt-4">
    <Button
      variant="outline"
      size="sm"
      disabled={selectedScreenshotIndex === 0}
      onClick={() => setSelectedScreenshotIndex(prev => Math.max(0, prev - 1))}
    >
      <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
      Previous
    </Button>

    <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
      {selectedScreenshotIndex + 1} of {timeline.screenshots.length}
    </div>

    <Button
      variant="outline"
      size="sm"
      disabled={selectedScreenshotIndex === timeline.screenshots.length - 1}
      onClick={() => setSelectedScreenshotIndex(prev => Math.min(timeline.screenshots.length - 1, prev + 1))}
    >
      Next
      <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
    </Button>
  </div>
</CardContent>
```

**Benefits:**
- Clear scroll indicators
- Keyboard navigation buttons
- Position counter for context

#### Alert for Phase Summaries
**Priority:** MEDIUM
**Files:** `app/timeline/[id]/page.tsx` (Lines 257-278)

Make phase summaries visually distinct:

```typescript
{currentReport.type === 'summary' && (
  <>
    <Alert className="mb-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20">
      <BarChart className="h-4 w-4 text-purple-600" />
      <AlertTitle className="text-purple-900 dark:text-purple-100">
        Phase Summary Report
      </AlertTitle>
      <AlertDescription className="text-purple-800 dark:text-purple-200">
        This report synthesizes patterns from the last 5 screenshots in your timeline.
      </AlertDescription>
    </Alert>

    {currentReport.phaseTitle && (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Phase Title</h3>
        <p className="text-xl font-semibold text-purple-700 dark:text-purple-300">
          {currentReport.phaseTitle}
        </p>
      </div>
    )}
  </>
)}
```

**Benefits:**
- Clear visual distinction from regular reports
- Users understand context of summary
- Professional styling

#### Tabs for Multiple Reports
**Priority:** LOW
**Files:** `app/timeline/[id]/page.tsx` (Lines 222-321)

When multiple reports exist for one screenshot, add tabs:

```typescript
{currentReports.length > 1 ? (
  <Tabs defaultValue={currentReports[0].id} className="mb-8">
    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${currentReports.length}, 1fr)` }}>
      {currentReports.map((report) => (
        <TabsTrigger key={report.id} value={report.id}>
          {report.type === 'summary' ? '📊 Summary' :
           report.type === 'initial' ? 'Initial' : 'Changes'}
        </TabsTrigger>
      ))}
    </TabsList>

    {currentReports.map((currentReport) => (
      <TabsContent key={currentReport.id} value={currentReport.id}>
        <Card>
          {/* ... existing report content */}
        </Card>
      </TabsContent>
    ))}
  </Tabs>
) : /* ... single report display */}
```

**Benefits:**
- Clean UI when multiple reports exist
- Easy switching between reports
- Tab pattern is familiar to users

---

## 📋 Phase 3: Polish & Power Features (PENDING)

**Estimated Time:** ~17 hours
**Priority:** MEDIUM

### Components to Install
```bash
npx shadcn@latest add command
npx shadcn@latest add dropdown-menu
npx shadcn@latest add alert-dialog
npx shadcn@latest add tooltip
npx shadcn@latest add tabs
npx shadcn@latest add hover-card
npx shadcn@latest add select
```

### Global Features

#### Command Palette
**Priority:** HIGH
**Files:** `components/command-palette.tsx` (new file), `app/layout.tsx`

Add keyboard shortcut navigation (Cmd/Ctrl+K):

```typescript
// components/command-palette.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Upload, History, Home } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => { router.push('/'); setOpen(false); }}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => { router.push('/upload'); setOpen(false); }}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload Screenshots</span>
          </CommandItem>
          <CommandItem onSelect={() => { router.push('/history'); setOpen(false); }}>
            <History className="mr-2 h-4 w-4" />
            <span>View History</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Add to app/layout.tsx
import { CommandPalette } from "@/components/command-palette";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CommandPalette />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**Benefits:**
- Power user feature
- Faster navigation
- Industry-standard UX pattern

### Report Page Features

#### DropdownMenu for Actions
**Priority:** MEDIUM
**Files:** `app/report/[id]/page.tsx` (Lines 337-350)

Add share and export options:

```typescript
<div className="flex gap-4 justify-center items-center flex-wrap">
  <Button asChild>
    <Link href="/upload">
      <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
      New Comparison
    </Link>
  </Button>
  <Button variant="outline" asChild>
    <Link href="/history">
      <History className="mr-2 h-4 w-4" aria-hidden="true" />
      View History
    </Link>
  </Button>

  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="icon" aria-label="More actions">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Report Actions</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }}>
        <Link2 className="mr-2 h-4 w-4" />
        Copy Link
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Print Report
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**Benefits:**
- Share reports easily
- Print functionality
- Clean action organization

### History Page Features

#### Search and Filter
**Priority:** HIGH
**Files:** `app/history/page.tsx` (After line 23)

Add search input and type filter:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [filterType, setFilterType] = useState<'all' | 'comparison' | 'timeline'>('all');

const filteredItems = items.filter(item => {
  // Filter by type
  if (filterType === 'comparison' && !isComparisonResult(item)) return false;
  if (filterType === 'timeline' && !isTimelineComparison(item)) return false;

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    if (isTimelineComparison(item)) {
      return item.title?.toLowerCase().includes(query);
    } else if (isComparisonResult(item)) {
      return item.imageA.name.toLowerCase().includes(query) ||
             item.imageB.name.toLowerCase().includes(query) ||
             item.comparison.changes.some(c => c.toLowerCase().includes(query));
    }
  }

  return true;
});

// UI
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
  <div className="flex-1 w-full sm:max-w-sm">
    <Input
      type="search"
      placeholder="Search comparisons and timelines..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full"
      aria-label="Search history"
    />
  </div>

  <div className="flex gap-2 w-full sm:w-auto">
    <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
      <SelectTrigger className="w-[180px]" aria-label="Filter by type">
        <SelectValue placeholder="Filter by type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Items</SelectItem>
        <SelectItem value="comparison">Comparisons Only</SelectItem>
        <SelectItem value="timeline">Timelines Only</SelectItem>
      </SelectContent>
    </Select>

    <Button asChild>
      <Link href="/upload">
        <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
        New Comparison
      </Link>
    </Button>
  </div>
</div>
```

**Benefits:**
- Find specific comparisons quickly
- Filter by type
- Better UX for users with many items

#### DropdownMenu for Item Actions
**Priority:** MEDIUM
**Files:** `app/history/page.tsx` (Lines 98-104, 178-184)

Add actions to each history item:

```typescript
<div className="flex items-center gap-2">
  <Button asChild size="sm">
    <Link href={`/timeline/${item.id}`}>
      <Play className="mr-2 h-4 w-4" aria-hidden="true" />
      View Timeline
    </Link>
  </Button>

  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="More actions">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/timeline/${item.id}`);
        toast.success('Link copied to clipboard');
      }}>
        <Link2 className="mr-2 h-4 w-4" />
        Copy Link
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleAddToTimeline(item.id)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Screenshot
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive"
        onClick={() => handleDeleteItem(item.id)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

#### AlertDialog for Delete Confirmation
**Priority:** HIGH
**Files:** `app/history/page.tsx`

Prevent accidental deletion:

```typescript
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState<string | null>(null);

const handleDeleteItem = (id: string) => {
  setItemToDelete(id);
  setDeleteDialogOpen(true);
};

const confirmDelete = () => {
  if (itemToDelete) {
    localStorage.removeItem(`comparison-${itemToDelete}`);
    localStorage.removeItem(`timeline-${itemToDelete}`);
    setItems(items.filter(item => item.id !== itemToDelete));
    toast.success('Item deleted successfully');
  }
  setDeleteDialogOpen(false);
  setItemToDelete(null);
};

<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this {/* timeline or comparison */}. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Benefits:**
- Prevents accidental deletion
- Clear warning message
- Standard confirmation pattern

### Timeline Page Features

#### Keyboard Navigation
**Priority:** MEDIUM
**Files:** `app/timeline/[id]/page.tsx` (Add useEffect after line 32)

Add arrow key navigation:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!timeline) return;

    // Arrow keys for navigation
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedScreenshotIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedScreenshotIndex(prev => Math.min(timeline.screenshots.length - 1, prev + 1));
    }
    // Number keys for direct selection (1-9)
    else if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      if (index < timeline.screenshots.length) {
        setSelectedScreenshotIndex(index);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [timeline]);
```

**Benefits:**
- Power user feature
- Faster navigation
- Better accessibility

#### HoverCard for Screenshot Details
**Priority:** LOW
**Files:** `app/timeline/[id]/page.tsx` (Lines 150-175)

Show details on hover:

```typescript
<HoverCard>
  <HoverCardTrigger asChild>
    <div
      className={cn(
        "flex-shrink-0 cursor-pointer transition-all duration-200",
        selectedScreenshotIndex === index && "ring-2 ring-primary scale-105"
      )}
      onClick={() => setSelectedScreenshotIndex(index)}
    >
      {/* ... existing screenshot thumbnail */}
    </div>
  </HoverCardTrigger>
  <HoverCardContent className="w-80">
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{screenshot.name}</h4>
      <p className="text-xs text-muted-foreground">
        Uploaded: {new Date(screenshot.timestamp).toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground">
        Size: {(screenshot.size / 1024).toFixed(0)}KB
      </p>
      {timeline.reports.find(r => r.toScreenshotId === screenshot.id)?.changes[0] && (
        <p className="text-xs border-t pt-2 mt-2">
          <span className="font-medium">First change:</span>{' '}
          {timeline.reports.find(r => r.toScreenshotId === screenshot.id)?.changes[0]}
        </p>
      )}
    </div>
  </HoverCardContent>
</HoverCard>
```

**Benefits:**
- Quick preview of screenshot details
- No click required
- Contextual information

#### Tooltip for File Size Limits (Upload Page)
**Priority:** LOW
**Files:** `app/upload/page.tsx` (Lines 476-478)

```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        PNG, JPG up to 10MB
        <InfoIcon className="h-3 w-3" />
      </p>
    </TooltipTrigger>
    <TooltipContent>
      <p className="max-w-xs">Images over 10MB may fail to upload. For best results, use images under 5MB.</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 🎯 Implementation Priority Summary

### Must Have (Before Launch)
1. ✅ Toast notifications (COMPLETED)
2. ✅ Skeleton loaders (COMPLETED)
3. ✅ Accessibility improvements (COMPLETED)
4. Dialog image zoom (Phase 2)
5. Progress indicators (Phase 2)
6. AlertDialog for confirmations (Phase 2)

### Should Have (Nice to Have)
1. Command Palette (Phase 3)
2. Search/Filter history (Phase 3)
3. ScrollArea with indicators (Phase 2)
4. DropdownMenu actions (Phase 3)

### Could Have (Future Enhancement)
1. Keyboard navigation (Phase 3)
2. HoverCard details (Phase 3)
3. Accordion for insights (Phase 2)
4. Tabs for reports (Phase 2)
5. Tooltips (Phase 3)

---

## 📊 Accessibility Checklist

### Global
- ✅ All decorative icons have `aria-hidden="true"`
- ✅ Interactive elements have proper ARIA attributes
- ✅ Lists marked with `role="list"`
- ⏳ Focus visible on all interactive elements (needs testing)
- ⏳ Color contrast meets WCAG AA (needs audit)
- ⏳ Add "Skip to main content" link

### Page-Specific
- ⏳ File inputs need `aria-describedby` for size limits
- ⏳ Drag & drop zones need `role="button"` and keyboard handlers
- ⏳ Progress updates need `aria-live="polite"` region
- ⏳ Error messages need `role="alert"`
- ⏳ Add heading hierarchy check (h1 → h2 → h3)

---

## 🧪 Testing Checklist

### After Phase 2
- [ ] Image zoom works on mobile and desktop
- [ ] Progress bars update correctly
- [ ] ScrollArea indicators show when scrollable
- [ ] Alert components have correct colors in dark mode
- [ ] Accordion expand/collapse animations smooth
- [ ] All dialogs close with Escape key

### After Phase 3
- [ ] Command Palette opens with Cmd/Ctrl+K
- [ ] Search filters work correctly
- [ ] Keyboard navigation (arrows, numbers) works
- [ ] Delete confirmation prevents accidental deletion
- [ ] Tooltips position correctly on all screen sizes
- [ ] Dropdown menus work on mobile

---

## 📝 Notes

### Component Version
- Using Tailwind CSS v4 with OKLCH color space
- shadcn/ui components from New York style (v4)
- Sonner used instead of default toast (registry issue)

### Known Issues
- Timeline page has console.log statements (lines 35, 50-59, 138-147) - should be removed
- Upload page needs conditional logging with `isDev` flag

### Performance Considerations
- Add `loading="lazy"` to all images
- Consider virtualization for history list if >50 items
- Memoize filtered items in history search

---

## 🚀 Quick Start Commands

### Install Phase 2 Components
```bash
npx shadcn@latest add dialog progress scroll-area alert accordion
```

### Install Phase 3 Components
```bash
npx shadcn@latest add command dropdown-menu alert-dialog tooltip tabs hover-card select
```

### Run Development Server
```bash
pnpm dev
```

### Type Check
```bash
pnpm tsc --noEmit
```

---

**Last Updated:** 2025-10-11
**Current Phase:** Phase 1 Complete ✅
**Next Phase:** Phase 2 - Enhanced Interactions
