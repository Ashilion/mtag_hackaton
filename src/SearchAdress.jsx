import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

export const SearchAdress = (props) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div
            className={`absolute ${isMobile ? 'top-0 left-0 right-0 rounded-t-none rounded-b-lg' : 'top-5 right-5'} 
                z-[1000] bg-gray-50 rounded-lg shadow transition-all duration-300
                ${isCollapsed ? 'p-2 w-auto' : isMobile ? 'p-3 w-full' : 'p-4 w-[300px]'}`}
        >
            {isCollapsed ? (
                <div className="flex items-center justify-between gap-2">
                    <Search size={16} className="text-gray-500" />
                    <button
                        onClick={toggleCollapse}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h1 className={`${isMobile ? 'text-sm' : 'text-base'}`}>
                            {isMobile ? 'Entrez les adresses:' : 'Cliquez sur la carte pour placer les points ou entrez les adresses :'}
                        </h1>
                        <button
                            onClick={toggleCollapse}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none ml-2 flex-shrink-0 cursor-pointer"
                        >
                            <ChevronUp size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col items-start mt-2">
                        <label className="mb-1 text-sm">Adresse initiale</label>
                        <Input
                            type="text"
                            placeholder="Entrez l'adresse initiale"
                            onChange={props.onChange}
                            className="mb-2 w-full text-sm"
                        />
                        <label className="mb-1 text-sm">Adresse finale</label>
                        <Input
                            type="text"
                            placeholder="Entrez l'adresse finale"
                            onChange={props.onChange1}
                            className="w-full text-sm"
                        />
                    </div>

                    <Button onClick={props.onClick} className="mt-3 w-full sm:w-auto">
                        Calculer
                    </Button>
                </>
            )}
        </div>
    );
}