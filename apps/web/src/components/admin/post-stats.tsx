"use client"

import { useMemo, useState } from "react"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useT } from "@/components/layout/trans"
import { type PostSummary } from "@bitlog/database"

type TimeRange = "7d" | "30d" | "90d" | "all"

interface PostStatsProps {
  posts: PostSummary[]
}

/** Shared chart config for both charts (posts count). */
function buildChartConfig(label: string) {
  return {
    count: {
      label,
      color: "hsl(var(--primary))",
    },
  }
}

const RANGE_DAYS: Record<TimeRange, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
}

// Coarse "now" (refreshed at most once a minute) so the date-window
// cutoff can be computed during render without calling the impure
// Date.now() directly in the component (react-compiler lint) — chart
// windows don't need second-level precision.
let coarseNow: number | null = null
function nowCoarse(): number {
  if (coarseNow === null || Date.now() - coarseNow > 60_000) {
    coarseNow = Date.now()
  }
  return coarseNow
}

/** Short ranges bucket by day; longer ranges by month. */
function bucketKey(date: string, range: TimeRange): string {
  const day = date.slice(0, 10)
  if (range === "7d" || range === "30d") return day
  return day.slice(0, 7) // YYYY-MM
}

/** Axis ticks: keep year on monthly buckets; day buckets show MM-DD. */
function formatTimelineTick(value: string): string {
  if (value.length >= 10) return value.slice(5) // MM-DD
  return value // YYYY-MM
}

export function PostStats({ posts }: PostStatsProps) {
  const { t } = useT()
  const [timeRange, setTimeRange] = useState<TimeRange>("all")
  const chartConfig = useMemo(
    () => buildChartConfig(t("admin.posts") as string),
    [t]
  )

  const publishedPosts = useMemo(() => posts.filter((p) => !p.draft), [posts])

  const timeRangeLabels = useMemo<Record<TimeRange, string>>(
    () => ({
      "7d": t("admin.days7") as string,
      "30d": t("admin.days30") as string,
      "90d": t("admin.days90") as string,
      all: t("admin.allTime") as string,
    }),
    [t]
  )

  const filteredPosts = useMemo(() => {
    const days = RANGE_DAYS[timeRange]
    if (days == null) return publishedPosts
    // Exact rolling N×24h timestamp window — post.date is a UTC ISO
    // string, so comparing timestamps (not civil-date strings) keeps the
    // boundary correct in every timezone.
    const cutoff = nowCoarse() - days * 86_400_000
    return publishedPosts.filter((p) => new Date(p.date).getTime() >= cutoff)
  }, [publishedPosts, timeRange])

  // Posts over time — bucket granularity follows the selected range.
  const timelineData = useMemo(() => {
    const byBucket: Record<string, number> = {}
    for (const p of filteredPosts) {
      const key = bucketKey(p.date, timeRange)
      byBucket[key] = (byBucket[key] || 0) + 1
    }
    return Object.entries(byBucket)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))
  }, [filteredPosts, timeRange])

  // Posts by tag (top 8)
  const tagData = useMemo(() => {
    const byTag: Record<string, number> = {}
    for (const p of filteredPosts) {
      for (const tag of p.tags) {
        byTag[tag] = (byTag[tag] || 0) + 1
      }
    }
    return Object.entries(byTag)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [filteredPosts])

  const renderTimeRangeSelect = () => (
    <Select
      value={timeRange}
      onValueChange={(v) => setTimeRange(v as TimeRange)}
    >
      <SelectTrigger size="sm" className="w-28">
        <SelectValue>{timeRangeLabels[timeRange]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="7d">{t("admin.days7") as string}</SelectItem>
        <SelectItem value="30d">{t("admin.days30") as string}</SelectItem>
        <SelectItem value="90d">{t("admin.days90") as string}</SelectItem>
        <SelectItem value="all">{t("admin.allTime") as string}</SelectItem>
      </SelectContent>
    </Select>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.postsOverTime") as string}</CardTitle>
          <CardAction>{renderTimeRangeSelect()}</CardAction>
        </CardHeader>
        <CardContent>
          {timelineData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              {t("admin.noDataForRange") as string}
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[240px] w-full"
            >
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={formatTimelineTick}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={32}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Tags Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.postsByTag") as string}</CardTitle>
          <CardAction>{renderTimeRangeSelect()}</CardAction>
        </CardHeader>
        <CardContent>
          {tagData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              {t("admin.noTags") as string}
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[240px] w-full"
            >
              <BarChart data={tagData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  type="category"
                  dataKey="tag"
                  tickLine={false}
                  axisLine={false}
                  width={150}
                  tickMargin={8}
                  tickFormatter={(value: string) =>
                    value.length > 18 ? `${value.slice(0, 17)}…` : value
                  }
                  interval={0}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
