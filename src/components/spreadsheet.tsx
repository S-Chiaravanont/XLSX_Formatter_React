import React, { useEffect, useState } from "react";

interface StatefulComponentState {
    inputArray: string[][];
    structureArray: number[][][];
    cellSelected: string;
}

const Spreadsheet: React.FC = () => {
    const [inputArray, setInputArray] = useState<string[][]>([]);
    const [structureArray, setStructureArray] = useState<number[][][]>([]);
    const [cellSelected, setCellSelected] = useState<string>('');
    const [columnMenuVisibility, setColumnMenuVisibility] = useState<Boolean>(false);
    const [rowMenuVisibility, setRowMenuVisibility] = useState<Boolean>(false);
    const [cellMenuVisibility, setCellMenuVisibility] = useState<Boolean>(false);
    const [mergeModalStatus, setMergeModalStatus] = useState<Boolean>(false);

    useEffect(() => {
        setStructureArray(Array.from({length: 10}, () => Array(10).fill([1,1])))
        setInputArray(Array.from({length: 10}, () => Array(10).fill('')))
    }, [])

    console.log(structureArray)

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
        if (!cellSelected) {
            return
        }
        // console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        setColumnMenuVisibility(false);
        const currentColumnIndex: number = parseInt(cellSelected.split('-')[2])

        const shallowCopyStructureArray = [...structureArray]
        const shallowCopyInputArray = [...inputArray]
        const loopLength = inputArray.length;

        for (let i = 0; i < loopLength; i++) {
            if (selectedCommand.includes('remove')) {
                shallowCopyInputArray[i].splice(currentColumnIndex, 1)  
            } else {
                if (selectedCommand.includes('left')) {
                    shallowCopyInputArray[i].splice(currentColumnIndex, 0, '')
                } else if (selectedCommand.includes('right')) {
                    shallowCopyInputArray[i].splice(currentColumnIndex + 1, 0, '')
                }
            }
        }
        setInputArray(shallowCopyInputArray)
        if (selectedCommand.includes('left')) {
            const selectedCellArray = cellSelected.split('-')
            selectedCellArray[2] = String(currentColumnIndex + 1)
            setCellSelected(selectedCellArray.join('-'))
        }
    }

    const handleRowMenu = (e: React.MouseEvent) : void => {
        if (!cellSelected) {
            return
        }
        // console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        setRowMenuVisibility(false)
        const currentRowIndex: number = parseInt(cellSelected.split('-')[1])
        if (selectedCommand.includes('remove')) {
            const shallowCopyInputArray = [...inputArray]
            shallowCopyInputArray.splice(currentRowIndex, 1)  
            setInputArray(shallowCopyInputArray)
        } else {
            const numberOfColumn = inputArray[0].length
            const newRow = Array(numberOfColumn).fill('')
            const shallowCopyInputArray = [...inputArray]
            const shallowCopyStructureArray = [...structureArray]
            if (selectedCommand.includes('above')) {
                shallowCopyInputArray.splice(currentRowIndex, 0, newRow)
                const selectedCellArray = cellSelected.split('-')
                selectedCellArray[1] = String(currentRowIndex + 1)
                setCellSelected(selectedCellArray.join('-'))
                setInputArray(shallowCopyInputArray)
            } else if (selectedCommand.includes('below')) {
                shallowCopyInputArray.splice(currentRowIndex + 1, 0, newRow)
                setInputArray(shallowCopyInputArray)
            }
        }
    }

    const handleCellMenu = (e: React.MouseEvent) : void => {
        if (!cellSelected) {
            return
        }
        // console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        setCellMenuVisibility(false)
        const shallowCopyStructureArray = [...structureArray]
        const selectedColumnIndex: number = parseInt(cellSelected.split('-')[2])
        const selectedRowIndex: number = parseInt(cellSelected.split('-')[1])
        if (selectedCommand === "merge-cell") {
            setMergeModalStatus(true)
        } else if (selectedCommand.includes('split')) {
            const columnStructure: number = structureArray[selectedRowIndex][selectedColumnIndex][1];
            const rowStructure: number = structureArray[selectedRowIndex][selectedColumnIndex][0];
            if (columnStructure === 1 && rowStructure === 1) {
                return
            } else {
                for (let i = 0; i < rowStructure; i++) {
                    for (let j = 0; j < columnStructure; j++) {
                        shallowCopyStructureArray[selectedRowIndex + i][selectedColumnIndex + j][0] = 1;
                        shallowCopyStructureArray[selectedRowIndex + i][selectedColumnIndex + j][1] = 1;
                    }
                }
            }
        }
        setStructureArray(shallowCopyStructureArray)
    }

    const handleMergeSubmit = (e: React.FormEvent<HTMLFormElement>) : void => {
        e.preventDefault()
        const newColumnStructureValue: number = parseInt(e.currentTarget.mergeColumnValue.value)
        const newRowStructureValue: number = parseInt(e.currentTarget.mergeRowValue.value)

        if (newColumnStructureValue === 1 && newRowStructureValue === 1) {
            setMergeModalStatus(false)
            let form = document.getElementById('mergeForm')
            if(form) (form as HTMLFormElement).reset();
            return
        }

        const selectedColumnIndex: number = parseInt(cellSelected.split('-')[2])
        const selectedRowIndex: number = parseInt(cellSelected.split('-')[1])
        const shallowCopyStructureArray = [...structureArray]
        for (let i = 0; i < newRowStructureValue; i++) {
            for (let j = 0; j < newColumnStructureValue; j++) {
                if (i === 0 && j === 0) {
                    shallowCopyStructureArray[selectedRowIndex + i][selectedColumnIndex + j] = [newRowStructureValue, newColumnStructureValue];
                } else {
                    shallowCopyStructureArray[selectedRowIndex + i][selectedColumnIndex + j] = [0, 0];
                }
            }
        }
        setStructureArray(shallowCopyStructureArray)
        setMergeModalStatus(false)
        let form = document.getElementById('mergeForm')
        if(form) (form as HTMLFormElement).reset();
    }

    const mergeModal = () => {
        if (mergeModalStatus) {
            return (
                <div className="merge-modal" id="merge-modal">
                    <form onSubmit={handleMergeSubmit} id="mergeForm">
                        <p>Merge tool:</p>
                        <p>Column span:</p><input type="number" id="merge-column" name="mergeColumnValue" defaultValue={1} />
                        <p>Row span:</p><input type="number" id="merge-row" name="mergeRowValue" defaultValue={1} />
                        <div>
                            <button type="submit">Merge</button>
                            <button onClick={() => setMergeModalStatus(false)}>Back</button>
                        </div>
                    </form>
                </div>
            )
        } else {
            return
        }
    }

    const renderCell = (rowIndex: number, columnIndex: number) => {
        const rowStructureValueAtIndex: number = structureArray[rowIndex][columnIndex][0]
        const columnStructureValueAtIndex: number = structureArray[rowIndex][columnIndex][1]
        if (rowStructureValueAtIndex === 0 && columnStructureValueAtIndex === 0) {
            return <></>
        } else {
            return (
                <td key={`${rowIndex}-${columnIndex}`} id={`cell-${rowIndex}-${columnIndex}`} className={isCellSelected(`cell-${rowIndex}-${columnIndex}`) ? "selectedCell" : "spreadsheet-tbody-tr-td"} onClick={handleOnSelected} colSpan={columnStructureValueAtIndex} rowSpan={rowStructureValueAtIndex}>
                {/* <input id={`input-${rowIndex}-${columnIndex}`} type="text" /> */}
                </td>
            )
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
                            <p id="add-column-left" onClick={handleColumnMenu}>Add column (left)</p>
                            <p id="add-column-right" onClick={handleColumnMenu}>Add column (right)</p>
                            <p id="remove-column" onClick={handleColumnMenu}>Remove column</p>
                        </div>}
                    </div> 
                    <div className="row-dropdown" onMouseEnter={() => setRowMenuVisibility(true)} onMouseLeave={() => setRowMenuVisibility(false)}>
                        <button className="row-dropbtn">Row</button>
                        {rowMenuVisibility && <div className="row-dropdown-content" id='row-dropdown-content'>
                            <p id="add-row-above" onClick={handleRowMenu}>Add row (above)</p>
                            <p id="add-row-below" onClick={handleRowMenu}>Add row (below)</p>
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
                            {inputArray[0] && inputArray[0].map((_, index) => {
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
                                    {row.map((_, columnIndex) => {
                                        return renderCell(rowIndex, columnIndex)
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