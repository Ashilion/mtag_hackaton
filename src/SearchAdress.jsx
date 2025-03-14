import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import React, { useState } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

export const SearchAdress = (props) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div
            className={`absolute top-5 right-5 z-[1000] bg-gray-50 rounded-lg shadow ${isCollapsed ? 'p-2 w-auto' : 'p-4 w-[300px]'}`}
        >
            {isCollapsed ? (
                <div className="flex items-center gap-2">
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
                        <h1 className="text-center">
                            Cliquez sur la carte pour placer les points ou entrez les adresses :
                        </h1>
                        <button
                            onClick={toggleCollapse}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none ml-2 flex-shrink-0 cursor-pointer"
                        >
                            <ChevronUp size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center mt-4">
                        <label className="mb-2">Adresse initiale</label>
                        <Input
                            type="text"
                            placeholder="Entrez l'adresse initiale"
                            onChange={props.onChange}
                            className="mb-4 w-full"
                        />
                        <label className="mb-2">Adresse finale</label>
                        <Input
                            type="text"
                            placeholder="Entrez l'adresse finale"
                            onChange={props.onChange1}
                            className="w-full"
                        />
                    </div>

                    <Button onClick={props.onClick} className="mt-4">
                        Calculer
                    </Button>
                </>
            )}
        </div>
    );
}