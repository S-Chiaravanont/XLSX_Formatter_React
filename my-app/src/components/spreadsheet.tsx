import React, { useEffect, useState } from "react";

interface StatefulComponentState {
    inputArray: string[][];
    structureArray: number[][];
    cellSelected: string;
}

const Spreadsheet: React.FC = () => {
    const [inputArray, setInputArray] = useState<string[][]>([]);
    const [structureArray, setStructureArray] = useState<number[][]>([]);
    const [cellSelected, setCellSelected] = useState<string>('');

    const handleOnSelected = (event: React.MouseEvent): void => {
        let cellIndex: string;
        if ((event.target as Element).nodeName !== "TD") {
            cellIndex = ((event.target as Element)!.parentNode as Element)!.id;
        } else {
            cellIndex = (event.target as Element).id;
        }
        setCellSelected(cellIndex)
    }

    const isCellSelected = (cellIndex: string) => {
        return cellIndex === cellSelected
    }

    useEffect(() => {
        setStructureArray(Array.from({length: 10}, () => Array(10).fill(1)))
        setInputArray(Array.from({length: 10}, () => Array(10).fill('')))
    }, [])

    return (
        <div className="spreadsheet-div">
            <table className="spreadsheet-table">
                <thead className="spreadsheet-thead">
                    <tr className="spreadsheet-thead-tr">
                    <th className="spreadsheet-thead-tr-td-first"></th>
                        {structureArray.map((_, index) => {
                            return (
                                <th className="spreadsheet-thead-tr-td">{index + 1}</th>
                            )
                        })}
                    </tr>
                </thead>
                <tbody className="spreadsheet-tbody">
                    {inputArray.map((row, rowIndex) => {
                        return (
                            <tr key={rowIndex} className="spreadsheet-tbody-tr">
                                <th className="spreadsheet-tbody-tr-td-first">{rowIndex + 1}</th>
                                {row.map((cell, columnIndex) => {
                                    return (
                                        <td key={`${rowIndex}-${columnIndex}`} id={`cell-${rowIndex}-${columnIndex}`} className={isCellSelected(`cell-${rowIndex}-${columnIndex}`) ? "selectedCell" : "spreadsheet-tbody-tr-td"} onClick={handleOnSelected}>
                                            <input id={`input-${rowIndex}-${columnIndex}`} type="text" />
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default Spreadsheet;