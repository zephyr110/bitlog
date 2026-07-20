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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { type PostSummary } from "@/types"

type TimeRange = "7d" | "30d" | "90d" | "all"

interface PostStatsProps {
  posts: PostSummary[]
}

export function PostStats({ posts }: PostStatsProps) {
  const { t } = useT()
  const [timeRange, setTimeRange] = useState<TimeRange>("all")

  const publishedPosts = useMemo(() => posts.filter((p) => !p.draft), [posts])

  const timeRangeLabels: Record<TimeRange, string> = {
    "7d": t("admin.days7") as string,
    "30d": t("admin.days30") as string,
    "90d": t("admin.days90") as string,
    all: t("admin.allTime") as string,
  }

  const filteredPosts = useMemo(() => {
    const now = new Date()
    const rangeMap: Record<TimeRange, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      all: Infinity,
    }
    const days = rangeMap[timeRange]
    if (days === Infinity) return publishedPosts
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return publishedPosts.filter((p) => new Date(p.date) >= cutoff)
  }, [publishedPosts, timeRange])

  // Posts over time data
  const timelineData = useMemo(() => {
    const published = filteredPosts.filter((p) => !p.draft)
    const byDate: Record<string, number> = {}
    published.forEach((p) => {
      const d = p.date.slice(0, 7) // YYYY-MM
      byDate[d] = (byDate[d] || 0) + 1
    })
    const sorted = Object.entries(byDate).sort()
    return sorted.map(([date, count]) => ({ date, count }))
  }, [filteredPosts])

  // Posts by tag data
  const tagData = useMemo(() => {
    const published = filteredPosts.filter((p) => !p.draft)
    const byTag: Record<string, number> = {}
    published.forEach((p) => {
      p.tags.forEach((tag) => {
        byTag[tag] = (byTag[tag] || 0) + 1
      })
    })
    return Object.entries(byTag)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [filteredPosts])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("admin.statistics") as string}</h2>
        <Select
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as TimeRange)}
        >
          <SelectTrigger className="w-32">
            <SelectValue>{timeRangeLabels[timeRange]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t("admin.days7") as string}</SelectItem>
            <SelectItem value="30d">{t("admin.days30") as string}</SelectItem>
            <SelectItem value="90d">{t("admin.days90") as string}</SelectItem>
            <SelectItem value="all">{t("admin.allTime") as string}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("admin.postsOverTime") as string}</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                {t("admin.noDataForRange") as string}
              </div>
            ) : (
              <ChartContainer
                config={{
                  count: {
                    label: t("admin.posts") as string,
                    color: "hsl(var(--primary))",
                  },
                }}
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
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
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
          </CardHeader>
          <CardContent>
            {tagData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                {t("admin.noTags") as string}
              </div>
            ) : (
              <ChartContainer
                config={{
                  count: {
                    label: t("admin.posts") as string,
                    color: "hsl(var(--primary))",
                  },
                }}
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
                    width={80}
                    tickMargin={8}
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
    </div>
  )
}
