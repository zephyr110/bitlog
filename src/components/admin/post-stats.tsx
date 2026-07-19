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
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
            <SelectValue />
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
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tagData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    type="category"
                    dataKey="tag"
                    tick={{ fontSize: 12 }}
                    width={80}
                    className="text-muted-foreground"
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
