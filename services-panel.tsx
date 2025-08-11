"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Save } from "lucide-react"
import { useSchedulingStore } from "@/store/scheduling-store"

export function ServicesPanel({}: { children?: never } = { children: undefined }) {
  const { services, addService, removeService, updateService } = useSchedulingStore()
  const [name, setName] = useState("")
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState(49)

  const onAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addService({
      name: trimmed,
      durationMin: Math.max(5, Math.min(480, Number(duration) || 30)),
      price: Math.max(0, Number(price) || 0),
    })
    setName("")
    setDuration(30)
    setPrice(49)
  }

  const totalServices = useMemo(() => services.length, [services.length])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"Services"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!services.length && (
            <div className="text-sm text-muted-foreground">{"No services yet. Add one on the right."}</div>
          )}
          {services.map((s) => (
            <div key={s.id} className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {s.durationMin} {"min"} {"• $"}
                    {s.price.toFixed(2)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Remove service" onClick={() => removeService(s.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor={`name-${s.id}`}>{"Name"}</Label>
                  <Input
                    id={`name-${s.id}`}
                    defaultValue={s.name}
                    onBlur={(e) => updateService(s.id, { name: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`dur-${s.id}`}>{"Duration (min)"}</Label>
                  <Input
                    id={`dur-${s.id}`}
                    type="number"
                    min={5}
                    max={480}
                    defaultValue={s.durationMin}
                    onBlur={(e) => updateService(s.id, { durationMin: Number(e.target.value) || s.durationMin })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`price-${s.id}`}>{"Price ($)"}</Label>
                  <Input
                    id={`price-${s.id}`}
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={s.price}
                    onBlur={(e) => updateService(s.id, { price: Number(e.target.value) || s.price })}
                  />
                </div>
              </div>
            </div>
          ))}
          {totalServices > 0 && (
            <Badge variant="secondary">
              {totalServices} {"service" + (totalServices === 1 ? "" : "s")}
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"Add a service"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="new-svc-name">{"Name"}</Label>
              <Input
                id="new-svc-name"
                placeholder="Consultation"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-svc-duration">{"Duration (min)"}</Label>
              <Input
                id="new-svc-duration"
                type="number"
                min={5}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-svc-price">{"Price ($)"}</Label>
              <Input
                id="new-svc-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onAdd} className="gap-2">
              <Plus className="size-4" />
              {"Add"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => {
                setName("")
                setDuration(30)
                setPrice(49)
              }}
            >
              <Save className="size-4" />
              {"Reset"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
