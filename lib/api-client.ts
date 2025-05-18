// API client for making requests to our backend

export async function fetchConversations() {
  const response = await fetch('/api/conversations');
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  return response.json();
}

export async function fetchConversation(id: string) {
  const response = await fetch(`/api/conversations?id=${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }
  return response.json();
}

export async function fetchConcepts(params?: { categoryId?: string; needsReview?: boolean }) {
  let url = '/api/concepts';
  
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params.needsReview !== undefined) searchParams.append('needsReview', params.needsReview.toString());
    
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch concepts');
  }
  return response.json();
}

export async function fetchConcept(id: string) {
  const response = await fetch(`/api/concepts?id=${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch concept');
  }
  return response.json();
}

export async function updateConcept(id: string, data: any) {
  const response = await fetch(`/api/concepts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update concept');
  }
  
  return response.json();
}

export async function fetchCategories() {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

export async function createCategory(data: { name: string; parentId?: string }) {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create category');
  }
  
  return response.json();
}

export async function analyzeConversation(conversationText: string) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversationText }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze conversation');
  }
  
  return response.json();
} 