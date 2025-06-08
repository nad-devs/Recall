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
  showAllOnFocus?: boolean
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  className,
  disabled = false,
  maxSuggestions = 10,
  filterFunction,
  autoSelectOnFocus = false,
  showAllOnFocus = true
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Enhanced filter function
  const defaultFilter = (options: AutocompleteOption[], query: string): AutocompleteOption[] => {
    // If no query and showAllOnFocus is true, show all options (limited by maxSuggestions)
    if (!query.trim() && showAllOnFocus) {
      return options.slice(0, maxSuggestions)
    }
    
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
    // Always show dropdown on focus if we have options
    if (filteredOptions.length > 0 || (showAllOnFocus && options.length > 0)) {
      setIsOpen(true)
    }
  }

  // Handle clicking on the input to show dropdown
  const handleClick = () => {
    if (!isOpen && (filteredOptions.length > 0 || (showAllOnFocus && options.length > 0))) {
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
        onClick={handleClick}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium transition-colors",
          "text-foreground", // Add explicit text color
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "hover:border-slate-400 dark:hover:border-slate-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "placeholder:text-slate-500 dark:placeholder:text-slate-400",
          className
        )}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-[9999] md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          <ul
            ref={listRef}
            className="absolute z-[10000] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
          >
            {filteredOptions.map((option, index) => (
              <li
                key={option.value}
                className={cn(
                  "relative cursor-pointer select-none py-3 px-4 text-sm transition-colors",
                  "hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-900 dark:hover:text-blue-100",
                  "border-b border-slate-100 dark:border-slate-700 last:border-b-0",
                  index === highlightedIndex && "bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100"
                )}
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{option.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
} 