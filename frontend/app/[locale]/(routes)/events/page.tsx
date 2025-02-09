"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Plus } from "lucide-react"
import { events as initialEvents } from "../../lib/mockData"
import { ViewState } from "@devexpress/dx-react-scheduler"
import {
  Scheduler,
  WeekView,
  Appointments,
  Toolbar,
  DateNavigator,
  TodayButton,
} from "@devexpress/dx-react-scheduler-material-ui"
import type { Event } from "../../lib/types"
import { EventForm } from "../../components/events/EventForm"
import { EventDetailModal } from "../../components/events/EventDetailModal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { getEvents, createEvent, updateEvent, deleteEvent } from "../../lib/api"
import { MaterialSelector, type Material } from "../../components/shared/MaterialSelector"

// Định nghĩa kiểu dữ liệu cho Scheduler
interface SchedulerData {
  id: string
  title: string
  startDate: Date
  endDate: Date
  rRule?: string
  allDay?: boolean
  instructor?: string
  description?: string
  location?: string
}

// Chuyển đổi Event sang dữ liệu cho Scheduler
const mapEventToSchedulerData = (event: Event): SchedulerData => ({
  id: event.id,
  title: event.title,
  startDate: event.start,
  endDate: event.end,
  instructor: event.instructor,
  description: event.description,
  rRule: "",
  allDay: false,
})

type TimeTableCellProps = WeekView.TimeTableCellProps;

// Custom component cho TimeTableCell
const TimeTableCell = (props: TimeTableCellProps) => {
  const { startDate = new Date(), ...restProps } = props;
  return (
    <WeekView.TimeTableCell
      {...restProps}
      startDate={startDate}
      style={{
        textAlign: "center",
        ...(startDate.getDay() === 0 || startDate.getDay() === 6
          ? { backgroundColor: "var(--muted)" }
          : {}),
      }}
    />
  );
};

// Custom component cho Appointment
const Appointment = ({ children, style, data, onClick, ...restProps }: any) => (
  <Appointments.Appointment
    {...restProps}
    style={{
      ...style,
      backgroundColor: 'transparent',
      border: '2px solid hsl(var(--primary))',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'hsl(var(--primary))',
        transform: 'scale(1.02)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        '& .appointment-text': {
          color: 'white',
        },
      },
    }}
    onClick={() => onClick?.(data)}
  >
    <div className="p-2 h-full flex flex-col justify-between">
      <div 
        className="appointment-text font-medium text-sm"
        style={{ 
          color: 'hsl(var(--primary))',
          transition: 'color 0.2s ease',
        }}
      >
        {data.title}
      </div>
      {data.instructor && (
        <div 
          className="appointment-text text-xs mt-1 flex items-center gap-1"
          style={{ 
            color: 'hsl(var(--primary))',
            transition: 'color 0.2s ease',
          }}
        >
          <span>TA {data.instructor}</span>
        </div>
      )}
    </div>
  </Appointments.Appointment>
)

const transformEventToFormData = (event: Event | null) => {
  if (!event) return undefined;
  return {
    title: event.title,
    startTime: format(event.start, "yyyy-MM-dd'T'HH:mm"),
    endTime: format(event.end, "yyyy-MM-dd'T'HH:mm"),
    description: event.description,
    instructor: event.instructor,
    materials: event.materials || []
  }
}

const transformFormDataToEvent = (formData: any) => {
  try {
    console.log('Transforming form data:', formData);
    
    // Kiểm tra dữ liệu đầu vào
    if (!formData?.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!formData?.startTime) {
      throw new Error('Start time is required');
    }
    if (!formData?.endTime) {
      throw new Error('End time is required');
    }

    // Chuyển đổi chuỗi thời gian thành đối tượng Date
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    
    // Kiểm tra tính hợp lệ của ngày
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start time format');
    }
    if (isNaN(endDate.getTime())) {
      throw new Error('Invalid end time format');
    }
    if (startDate >= endDate) {
      throw new Error('End time must be after start time');
    }

    // Tạo đối tượng event mới
    const eventData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || "",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      instructor: formData.instructor?.trim() || "",
      materials: Array.isArray(formData.materials) ? formData.materials : []
    };

    console.log('Transformed event data:', eventData);
    return eventData;
  } catch (error) {
    console.error('Error in transformFormDataToEvent:', error);
    throw error;
  }
}

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const { toast } = useToast()
  const t = useTranslations()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const data = await getEvents()
      setEvents(data)
    } catch (error) {
      toast({
        title: t('events.error.load'),
        description: t('events.error.loadDescription'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Lọc sự kiện trong ngày
  const todayEvents = events.filter((event) => {
    const today = new Date()
    const eventDate = new Date(event.start)
    return eventDate.toDateString() === today.toDateString()
  }).map(event => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end)
  }))

  const handleEventClick = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (event) {
      setSelectedEvent(event)
    }
  }

  const handleCreateEvent = async (formData: any) => {
    try {
      console.log('Creating event with form data:', formData);
      
      if (!formData) {
        throw new Error(t('events.error.missingData'));
      }

      // Chuyển đổi dữ liệu form thành event data
      const eventData = transformFormDataToEvent(formData);
      
      if (!eventData) {
        throw new Error(t('events.error.invalidFormData'));
      }

      console.log('Sending event data to server:', eventData);
      const createdEvent = await createEvent(eventData);
      
      setEvents(prevEvents => [...prevEvents, {
        ...createdEvent,
        start: new Date(createdEvent.start),
        end: new Date(createdEvent.end)
      }]);
      
      setIsFormOpen(false);
      toast({
        title: t('events.created'),
        description: t('events.createSuccess'),
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: t('events.error.create'),
        description: error instanceof Error ? error.message : t('events.error.createDescription'),
        variant: "destructive",
      });
    }
  }

  const handleUpdateEvent = async (id: string, formData: any) => {
    try {
      const updatedEvent = transformFormDataToEvent(formData)
      const result = await updateEvent(id, updatedEvent)
      setEvents(events.map(e => e.id === id ? result : e))
      toast({
        title: t('events.updated'),
        description: t('events.updateSuccess'),
      })
    } catch (error) {
      toast({
        title: t('events.error.update'),
        description: t('events.error.updateDescription'),
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id)
      setEvents(events.filter(e => e.id !== id))
      toast({
        title: t('events.deleted'),
        description: t('events.deleteSuccess'),
      })
    } catch (error) {
      toast({
        title: t('events.error.delete'),
        description: t('events.error.deleteDescription'),
        variant: "destructive",
      })
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setIsFormOpen(true)
  }

  // Chuyển đổi events sang dữ liệu cho Scheduler
  const schedulerData = events.map(mapEventToSchedulerData)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{t('events.title')}</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('events.addNew')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Danh sách sự kiện trong ngày */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">{t('events.today')}</h3>
              {todayEvents.length > 0 ? (
                <div className="space-y-4">
                  {todayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleEventClick(event.id)}
                    >
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {event.start.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {event.end.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('events.noEvents')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lịch */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <Scheduler data={schedulerData} height={700}>
                <ViewState
                  currentDate={currentDate}
                  onCurrentDateChange={setCurrentDate}
                />
                <WeekView
                  startDayHour={7}
                  endDayHour={22}
                  timeTableCellComponent={TimeTableCell}
                  cellDuration={60}
                  excludedDays={[]}
                />
                <Toolbar />
                <DateNavigator />
                <TodayButton />
                <Appointments
                  appointmentComponent={(props) => (
                    <Appointment {...props} onClick={(data: SchedulerData) => handleEventClick(data.id)} />
                  )}
                />
              </Scheduler>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form tạo/chỉnh sửa sự kiện */}
      <EventForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={(formData) => {
          if (editingEvent) {
            handleUpdateEvent(editingEvent.id, formData);
          } else {
            handleCreateEvent(formData);
          }
        }}
        initialData={editingEvent ? transformEventToFormData(editingEvent) : undefined}
      />

      {/* Modal xem chi tiết sự kiện */}
      <EventDetailModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
      />
    </div>
  )
}

