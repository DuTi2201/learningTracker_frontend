// Các options mặc định cho API requests
export const defaultOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
}

// Hàm lấy URL API dựa trên môi trường
export const getApiUrl = (path: string) => {
  const port = process.env.NEXT_PUBLIC_API_PORT || 5001
  return `http://localhost:${port}/api${path}`
}

// Materials API
export const getMaterials = async () => {
  const response = await fetch(getApiUrl('/materials'), defaultOptions)
  if (!response.ok) throw new Error('Failed to fetch materials')
  return response.json()
}

export const createMaterial = async (material: any) => {
  const response = await fetch(getApiUrl('/materials'), {
    ...defaultOptions,
    method: 'POST',
    body: JSON.stringify(material),
  })
  if (!response.ok) throw new Error('Failed to create material')
  return response.json()
}

export const updateMaterial = async (id: string, material: any) => {
  const response = await fetch(getApiUrl(`/materials/${id}`), {
    ...defaultOptions,
    method: 'PUT',
    body: JSON.stringify(material),
  })
  if (!response.ok) throw new Error('Failed to update material')
  return response.json()
}

export const deleteMaterial = async (id: string) => {
  const response = await fetch(getApiUrl(`/materials/${id}`), {
    ...defaultOptions,
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete material')
}

// Events API
export const getEvents = async () => {
  const response = await fetch(getApiUrl('/events'), defaultOptions)
  if (!response.ok) throw new Error('Failed to fetch events')
  const events = await response.json()
  return events.map((event: any) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }))
}

export const createEvent = async (event: any) => {
  const response = await fetch(getApiUrl('/events'), {
    ...defaultOptions,
    method: 'POST',
    body: JSON.stringify(event),
  })
  if (!response.ok) throw new Error('Failed to create event')
  return response.json()
}

export const updateEvent = async (id: string, event: any) => {
  const response = await fetch(getApiUrl(`/events/${id}`), {
    ...defaultOptions,
    method: 'PUT',
    body: JSON.stringify(event),
  })
  if (!response.ok) throw new Error('Failed to update event')
  return response.json()
}

export const deleteEvent = async (id: string) => {
  const response = await fetch(getApiUrl(`/events/${id}`), {
    ...defaultOptions,
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete event')
}

// Goals API
export const getGoals = async () => {
  const response = await fetch(getApiUrl('/goals'), defaultOptions)
  if (!response.ok) throw new Error('Failed to fetch goals')
  return response.json()
}

export const createGoal = async (goal: any) => {
  const response = await fetch(getApiUrl('/goals'), {
    ...defaultOptions,
    method: 'POST',
    body: JSON.stringify(goal),
  })
  if (!response.ok) throw new Error('Failed to create goal')
  return response.json()
}

export const updateGoal = async (id: number, goal: any) => {
  const response = await fetch(getApiUrl(`/goals/${id}`), {
    ...defaultOptions,
    method: 'PUT',
    body: JSON.stringify(goal),
  })
  if (!response.ok) throw new Error('Failed to update goal')
  return response.json()
}

export const deleteGoal = async (id: number) => {
  const response = await fetch(getApiUrl(`/goals/${id}`), {
    ...defaultOptions,
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete goal')
}

// Assignments API
export const getAssignments = async () => {
  const response = await fetch(getApiUrl('/assignments'), defaultOptions)
  if (!response.ok) throw new Error('Failed to fetch assignments')
  return response.json()
}

export const createAssignment = async (assignment: any) => {
  const response = await fetch(getApiUrl('/assignments'), {
    ...defaultOptions,
    method: 'POST',
    body: JSON.stringify(assignment),
  })
  if (!response.ok) throw new Error('Failed to create assignment')
  return response.json()
}

export const updateAssignment = async (id: number, assignment: any) => {
  const response = await fetch(getApiUrl(`/assignments/${id}`), {
    ...defaultOptions,
    method: 'PUT',
    body: JSON.stringify(assignment),
  })
  if (!response.ok) throw new Error('Failed to update assignment')
  return response.json()
}

export const deleteAssignment = async (id: number) => {
  const response = await fetch(getApiUrl(`/assignments/${id}`), {
    ...defaultOptions,
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete assignment')
}

// Notifications API
export const getNotifications = async () => {
  const response = await fetch(getApiUrl('/notifications'), defaultOptions)
  if (!response.ok) throw new Error('Failed to fetch notifications')
  return response.json()
}

export const getUnreadNotifications = async () => {
  const response = await fetch(getApiUrl('/notifications/unread'), defaultOptions)
  if (!response.ok) throw new Error('Failed to fetch unread notifications')
  return response.json()
}

export const markNotificationAsRead = async (id: number) => {
  const response = await fetch(getApiUrl(`/notifications/${id}/read`), {
    ...defaultOptions,
    method: 'PUT'
  })
  if (!response.ok) throw new Error('Failed to mark notification as read')
}

export const markAllNotificationsAsRead = async () => {
  const response = await fetch(getApiUrl('/notifications/read-all'), {
    ...defaultOptions,
    method: 'PUT'
  })
  if (!response.ok) throw new Error('Failed to mark all notifications as read')
}

export const deleteNotification = async (id: number) => {
  const response = await fetch(getApiUrl(`/notifications/${id}`), {
    ...defaultOptions,
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete notification')
}

// Upload API
export const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(getApiUrl('/upload'), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) throw new Error('Failed to upload file')
  return response.json()
}

// Search API
export const search = async (query: string) => {
  try {
    console.log('Sending search request for query:', query);
    const url = getApiUrl(`/search?query=${encodeURIComponent(query)}`);
    console.log('Search URL:', url);

    const response = await fetch(url, {
      ...defaultOptions,
      method: 'GET',
    });
    
    console.log('Search response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Search failed:', errorData);
      throw new Error(errorData.error || 'Search failed');
    }
    
    const results = await response.json();
    console.log('Search results:', results);
    return results;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

// Dashboard API
export const getDashboardStats = async () => {
  const response = await fetch(getApiUrl('/dashboard/stats'), defaultOptions)
  if (!response.ok) throw new Error('Failed to fetch dashboard stats')
  return response.json()
} 