import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

interface AccordionProps {
  type?: "single" | "multiple"
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  className?: string
  children: React.ReactNode
  defaultValue?: string | string[]
}

const AccordionContext = React.createContext<{
  value: string | string[]
  onValueChange: (value: string | string[]) => void
  type: "single" | "multiple"
}>({
  value: "",
  onValueChange: () => {},
  type: "single"
})

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", value, onValueChange, className, children, defaultValue }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === "single" ? "" : [])
    )

    const controlledValue = value !== undefined ? value : internalValue
    const controlledOnValueChange = onValueChange || setInternalValue

    return (
      <AccordionContext.Provider value={{
        value: controlledValue,
        onValueChange: controlledOnValueChange,
        type
      }}>
        <div ref={ref} className={cn("space-y-1", className)}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

interface AccordionItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    
    return (
      <div
        ref={ref}
        className={cn("border-b", className)}
        data-value={value}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { 
              ...child.props, 
              itemValue: value,
              isOpen: context.type === "single" 
                ? context.value === value 
                : Array.isArray(context.value) && context.value.includes(value)
            })
          }
          return child
        })}
      </div>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  itemValue?: string
  isOpen?: boolean
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, onClick, itemValue, isOpen, ...props }, ref) => {
    const context = React.useContext(AccordionContext)

    const handleClick = () => {
      if (!itemValue) {
        console.warn('AccordionTrigger: itemValue is missing')
        return
      }
      
      console.log('AccordionTrigger clicked:', { itemValue, isOpen, contextType: context.type })
      
      if (context.type === "single") {
        context.onValueChange(isOpen ? "" : itemValue)
      } else {
        const currentValue = Array.isArray(context.value) ? context.value : []
        const newValue = currentValue.includes(itemValue)
          ? currentValue.filter(v => v !== itemValue)
          : [...currentValue, itemValue]
        context.onValueChange(newValue)
      }
      
      onClick?.()
    }

    return (
      <div className="flex">
        <button
          ref={ref}
          className={cn(
            "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
            className
          )}
          onClick={handleClick}
          data-state={isOpen ? "open" : "closed"}
          {...props}
        >
          {children}
          <ChevronDown className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>
      </div>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps {
  className?: string
  children: React.ReactNode
  itemValue?: string
  isOpen?: boolean
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, itemValue, isOpen, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden text-sm transition-all duration-200 ease-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        <div className={cn("pb-4 pt-0", className)}>
          {children}
        </div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } 