"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Plus, Search } from "lucide-react"
import { useSchedulingStore } from "@/store/scheduling-store"
import { AppHeader } from "@/components/app-header"
import { CalendarMonth } from "@/components/calendar-month"
import { BookingDialog } from "@/components/booking-dialog"
import { BookingsList } from "@/components/bookings-list"
import { ServicesPanel } from "@/components/services-panel"
import { AvailabilityEditor } from "@/components/availability-editor"
import { ExportCSV } from "@/components/export-csv"
import { cn } from "@/lib/utils"

export default function Page() {
  const { initDemoData, openBooking, setOpenBooking, searchQuery, setSearchQuery } = useSchedulingStore()

  useEffect(() => {
    initDemoData()
  }, [initDemoData])

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Scheduling</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookings, clients, services"
                className="pl-8 w-64"
                aria-label="Search bookings"
              />
            </div>
            <ExportCSV />
            <BookingDialog />
            <Button onClick={() => setOpenBooking(true)} className={cn("gap-2")}>
              <Plus className="size-4" />
              {"New booking"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{"Overview"}</TabsTrigger>
            <TabsTrigger value="calendar">{"Calendar"}</TabsTrigger>
            <TabsTrigger value="bookings">{"Bookings"}</TabsTrigger>
            <TabsTrigger value="services">{"Services"}</TabsTrigger>
            <TabsTrigger value="availability">{"Availability"}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex items-center justify-between flex-row">
                  <CardTitle className="text-base">{"This Month"}</CardTitle>
                  <div className="text-sm text-muted-foreground">{"Click a day to add a booking"}</div>
                </CardHeader>
                <CardContent>
                  <CalendarMonth />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{"Upcoming bookings"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingsList limit={6} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle className="text-base">{"Calendar"}</CardTitle>
                <div className="text-sm text-muted-foreground">{"Month view"}</div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <CalendarMonth />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle className="text-base">{"All bookings"}</CardTitle>
                <div className="flex items-center gap-2">
                  <ExportCSV />
                  <BookingDialog />
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <BookingsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ServicesPanel />
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <AvailabilityEditor />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
