import {Input} from "@/components/ui/input.jsx";
import {Button} from "@/components/ui/button.jsx";
import React from "react";

export const SearchAdress = (props) => {
    return <div className="absolute top-5 right-5 z-[1000] bg-gray-50 rounded-lg shadow p-4 w-[300px]">
        <h1 className="text-center">Cliquez sur la carte pour placer les points ou entrez les adresses :</h1>
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

    </div>;
}