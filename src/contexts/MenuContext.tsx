import React, { createContext, useContext, useState, ReactNode } from 'react'

interface MenuContextType {
  selectedCategoryId: string | null
  setSelectedCategoryId: (categoryId: string | null) => void
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  return (
    <MenuContext.Provider value={{ selectedCategoryId, setSelectedCategoryId }}>
      {children}
    </MenuContext.Provider>
  )
}

export const useMenuContext = () => {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider')
  }
  return context
}