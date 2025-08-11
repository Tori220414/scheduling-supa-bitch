"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Service = {
  id: string
  name: string
  durationMin: number
  price: number
}

export type Booking = {
  id: string
  title: string
  serviceId: string
  clientName: string
  clientEmail: string
  start: Date | string
  end: Date | string
  notes?: string
}

export type DayAvailability = {
  enabled: boolean
  start: string // "09:00"
  end: string // "17:00"
}

type State = {
  services: Service[]
  bookings: Booking[]
  availability: Record<number, DayAvailability> // 0=Mon ... 6=Sun
  openBooking: boolean
  pendingDate: Date | null
  searchQuery: string
}

type Actions = {
  initDemoData: () => void
  setOpenBooking: (v: boolean) => void
  setPendingDate: (d: Date | null) => void
  setSearchQuery: (q: string) => void
  addService: (data: Omit<Service, "id">) => void
  updateService: (id: string, patch: Partial<Service>) => void
  removeService: (id: string) => void
  addBooking: (data: Omit<Booking, "id">) => void
  removeBooking: (id: string) => void
  setAvailabilityForDay: (idx: number, patch: Partial<DayAvailability>) => void
}

function id() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-expect-error
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

const defaultAvailability: Record<number, DayAvailability> = {
  0: { enabled: true, start: "09:00", end: "17:00" },
  1: { enabled: true, start: "09:00", end: "17:00" },
  2: { enabled: true, start: "09:00", end: "17:00" },
  3: { enabled: true, start: "09:00", end: "17:00" },
  4: { enabled: false, start: "10:00", end: "14:00" },
  5: { enabled: false, start: "10:00", end: "14:00" },
  6: { enabled: false, start: "10:00", end: "14:00" },
}

export const useSchedulingStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      services: [],
      bookings: [],
      availability: defaultAvailability,
      openBooking: false,
      pendingDate: null,
      searchQuery: "",

      initDemoData: () => {
        const { services, bookings } = get()
        if (services.length === 0) {
          const demoServices: Service[] = [
            { id: id(), name: "Consultation", durationMin: 30, price: 49 },
            { id: id(), name: "Follow-up", durationMin: 45, price: 69 },
            { id: id(), name: "Strategy Session", durationMin: 60, price: 99 },
          ]
          set({ services: demoServices })
          // seed a couple of bookings for current week
          const today = new Date()
          const startA = new Date(today)
          startA.setDate(today.getDate() + 1)
          startA.setHours(10, 0, 0, 0)
          const endA = new Date(startA.getTime() + demoServices[0].durationMin * 60000)

          const startB = new Date(today)
          startB.setDate(today.getDate() + 3)
          startB.setHours(14, 30, 0, 0)
          const endB = new Date(startB.getTime() + demoServices[2].durationMin * 60000)

          set({
            bookings: [
              {
                id: id(),
                title: demoServices[0].name,
                serviceId: demoServices[0].id,
                clientName: "Alex Johnson",
                clientEmail: "alex@example.com",
                start: startA,
                end: endA,
                notes: "First-time client.",
              },
              {
                id: id(),
                title: demoServices[2].name,
                serviceId: demoServices[2].id,
                clientName: "Sam Lee",
                clientEmail: "sam@example.com",
                start: startB,
                end: endB,
              },
            ],
          })
        } else if (bookings.length) {
          // revive dates if persisted as strings
          set({
            bookings: bookings.map((b) => ({
              ...b,
              start: new Date(b.start),
              end: new Date(b.end),
            })),
          })
        }
      },

      setOpenBooking: (v) => set({ openBooking: v }),
      setPendingDate: (d) => set({ pendingDate: d }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      addService: (data) =>
        set((state) => ({
          services: [...state.services, { ...data, id: id() }],
        })),

      updateService: (sid, patch) =>
        set((state) => ({
          services: state.services.map((s) => (s.id === sid ? { ...s, ...patch } : s)),
        })),

      removeService: (sid) =>
        set((state) => ({
          services: state.services.filter((s) => s.id !== sid),
          bookings: state.bookings.filter((b) => b.serviceId !== sid),
        })),

      addBooking: (data) =>
        set((state) => ({
          bookings: [
            ...state.bookings,
            {
              ...data,
              id: id(),
              // ensure Date objects for in-app use
              start: new Date(data.start),
              end: new Date(data.end),
            },
          ],
        })),

      removeBooking: (bid) =>
        set((state) => ({
          bookings: state.bookings.filter((b) => b.id !== bid),
        })),

      setAvailabilityForDay: (idx, patch) =>
        set((state) => ({
          availability: {
            ...state.availability,
            [idx]: { ...state.availability[idx], ...patch },
          },
        })),
    }),
    {
      name: "schedulingbitch-state",
      partialize: (s) => ({
        services: s.services,
        bookings: s.bookings,
        availability: s.availability,
      }),
    },
  ),
)
