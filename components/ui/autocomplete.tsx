import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AutocompleteOption {
  value: string
  label: string
  description?: string
}

interface AutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (option: AutocompleteOption) => void
  options: AutocompleteOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSuggestions?: number
  filterFunction?: (options: AutocompleteOption[], query: string) => AutocompleteOption[]
  autoSelectOnFocus?: boolean
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  className,
  disabled = false,
  maxSuggestions = 5,
  filterFunction,
  autoSelectOnFocus = false
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Default filter function
  const defaultFilter = (options: AutocompleteOption[], query: string): AutocompleteOption[] => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    return options
      .filter(option => 
        option.label.toLowerCase().includes(lowerQuery) ||
        option.value.toLowerCase().includes(lowerQuery) ||
        (option.description && option.description.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => {
        // Prioritize exact matches at the start
        const aStartsWithQuery = a.label.toLowerCase().startsWith(lowerQuery)
        const bStartsWithQuery = b.label.toLowerCase().startsWith(lowerQuery)
        
        if (aStartsWithQuery && !bStartsWithQuery) return -1
        if (!aStartsWithQuery && bStartsWithQuery) return 1
        
        // Then sort by length (shorter first)
        return a.label.length - b.label.length
      })
      .slice(0, maxSuggestions)
  }

  const filteredOptions = (filterFunction || defaultFilter)(options, value)

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
  }

  const handleOptionSelect = (option: AutocompleteOption) => {
    onChange(option.value)
    onSelect?.(option)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case 'Tab':
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault()
          handleOptionSelect(filteredOptions[highlightedIndex])
        } else {
          setIsOpen(false)
        }
        break
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay closing to allow for option clicks
    setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }, 150)
  }

  const handleFocus = () => {
    if (autoSelectOnFocus && inputRef.current) {
      inputRef.current.select()
    }
    if (filteredOptions.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "rounded-md border border-input bg-background px-3 py-2 text-sm font-medium",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              className={cn(
                "relative cursor-pointer select-none py-2 px-3 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                index === highlightedIndex && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 