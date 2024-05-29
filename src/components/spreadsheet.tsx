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
    const [columnMenuVisibility, setColumnMenuVisibility] = useState<Boolean>(false);
    const [rowMenuVisibility, setRowMenuVisibility] = useState<Boolean>(false);
    const [cellMenuVisibility, setCellMenuVisibility] = useState<Boolean>(false);
    const [mergeModalStatus, setMergeModalStatus] = useState<Boolean>(false);

    useEffect(() => {
        setStructureArray(Array.from({length: 10}, () => Array(10).fill(1)))
        setInputArray(Array.from({length: 10}, () => Array(10).fill('')))
    }, [])

    const handleOnSelected = (event: React.MouseEvent): void => {
        let cellIndex: string;
        if ((event.target as Element).nodeName !== "TD") {
            cellIndex = ((event.target as Element)!.parentNode as Element)!.id;
        } else {
            cellIndex = (event.target as Element).id;
        }
        if (cellIndex === cellSelected) {
            setCellSelected('')
        } else {
            setCellSelected(cellIndex)
        }
    }

    const isCellSelected = (cellIndex: string) => {
        return cellIndex === cellSelected
    }

    console.log(cellSelected)

    const handleColumnMenu = (e: React.MouseEvent): void => {
        console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        const columnMenuDropdown = document.getElementById('column-dropdown-button') as Element
        columnMenuDropdown?.classList.remove('display-none-toggle')

    }

    const handleRowMenu = (e: React.MouseEvent) : void => {
        console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        const columnMenuDropdown = document.getElementById('row-dropdown-button') as Element
        columnMenuDropdown?.classList.remove('display-none-toggle')
    }

    const handleCellMenu = (e: React.MouseEvent) : void => {
        console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        const columnMenuDropdown = document.getElementById('cell-dropdown-button') as Element
        columnMenuDropdown?.classList.remove('display-none-toggle')

        if (selectedCommand === "merge-cell") {
            console.log('work?')
            setMergeModalStatus(true)
        }
    }

    const mergeModal = () => {
        if (mergeModalStatus) {
            return (
                <div className="merge-modal" id="merge-modal">
                    <p>Merge tool:</p>
                    <p>Column span:</p><input type="number" id="merge-column" />
                    <p>Row span:</p><input type="number" id="merge-row" />
                    <div>
                        <button>Merge</button>
                        <button onClick={() => setMergeModalStatus(false)}>Back</button>
                    </div>
                </div>
            )
        } else {
            return
        }
    }

    return (
        <>
            <div className="spreadsheet-div">
                <div className="spreadsheet-menus-div">
                    <div className="row-dropdown" id='column-dropdown-div' onMouseEnter={() => setCellMenuVisibility(true)} onMouseLeave={() => setCellMenuVisibility(false)}>
                        <button className="row-dropbtn" id="cell-dropdown-button">Cell</button>
                        {cellMenuVisibility &&<div className="row-dropdown-content" id='cell-dropdown-content'>
                            <p id="merge-cell" onClick={handleCellMenu}>Merge</p>
                            <p id="split-cell" onClick={handleCellMenu}>Split</p>
                        </div>}
                    </div> 
                    <div className="row-dropdown" id='column-dropdown-div' onMouseEnter={() => setColumnMenuVisibility(true)} onMouseLeave={() => setColumnMenuVisibility(false)}>
                        <button className="row-dropbtn" id='column-dropdown-button'>Column</button>
                        {columnMenuVisibility && <div className="row-dropdown-content" id='column-dropdown-content'>
                            <p id="add-column-above" onClick={handleColumnMenu}>Add column (above)</p>
                            <p id="add-column-below" onClick={handleColumnMenu}>Add column (below)</p>
                            <p id="remove-column" onClick={handleColumnMenu}>Remove row</p>
                        </div>}
                    </div> 
                    <div className="row-dropdown" onMouseEnter={() => setRowMenuVisibility(true)} onMouseLeave={() => setRowMenuVisibility(false)}>
                        <button className="row-dropbtn">Row</button>
                        {rowMenuVisibility && <div className="row-dropdown-content" id='row-dropdown-content'>
                            <p id="add-row-left" onClick={handleRowMenu}>Add row (left)</p>
                            <p id="add-row-right" onClick={handleRowMenu}>Add row (right)</p>
                            <p id="remove-row" onClick={handleRowMenu}>Remove row</p>
                        </div>}
                    </div> 
                    <p style={{marginRight: '5px'}}><b>Selected Cell:</b></p>
                    <p>{cellSelected ? `${parseInt(cellSelected.split('-')[1]) + 1} - ${parseInt(cellSelected.split('-')[2]) + 1}` : "-"}</p>
                </div>

                <table className="spreadsheet-table">
                    <thead className="spreadsheet-thead">
                        <tr className="spreadsheet-thead-tr">
                        <th className="spreadsheet-thead-tr-td-first"></th>
                            {structureArray.map((_, index) => {
                                return (
                                    <th key={`header-${index}`} className="spreadsheet-thead-tr-td">{index + 1}</th>
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
                                                {/* <input id={`input-${rowIndex}-${columnIndex}`} type="text" /> */}
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {mergeModal()}
        </>
    )
}

export default Spreadsheet;