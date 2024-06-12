import React, { useEffect, useState } from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { arta } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import IonIcon from '@reacticons/ionicons';

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
    const [codeBlockData, setCodeBlockData] = useState<string>('');
    const [copyDataState, setCopyDataState] = useState<Boolean>(false);

    useEffect(() => {
        setStructureArray(Array.from({length: 10}, () => Array(10).fill([1,1])))
        setInputArray(Array.from({length: 10}, () => Array(10).fill('')))
    }, [])

    useEffect(() => {
        let newCodeData = '';
        structureArray.forEach((row, rowIndex) => {
            row.forEach((column, columnIndex) => {
                if (column[0] > 1 || column[1] > 1) {
                    newCodeData += "  { s: { r: " + rowIndex + ", c: " + columnIndex + " }, e: { r: " + (rowIndex + column[0]) + "}, c: " + (columnIndex + column[1]) + " } },\n"
                }
            })
        })
        const finalCodeData = "const merge = [\n" + newCodeData + "];\nws['!merges'] = merge;"
        setCodeBlockData(finalCodeData)
        if (copyDataState) {
            setCopyDataState(!copyDataState)
        }
    }, [structureArray])

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

    const handleColumnMenu = (e: React.MouseEvent): void => {
        if (!cellSelected) {
            return
        }
        const selectedCommand = (e.target as Element).id
        setColumnMenuVisibility(false);
        const currentColumnIndex: number = parseInt(cellSelected.split('-')[2])
        const currentRowIndex: number = parseInt(cellSelected.split('-')[1])

        const shallowCopyStructureArray = [...structureArray]
        const shallowCopyInputArray = [...inputArray]
        const loopLength = inputArray.length;

        // inputArray changes
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

        // structureArray changes
        if (selectedCommand.includes('left')) {
            // Condition 1:
            // --- first column selected, adding left doesn't affect any merged cell
            // Condition 2:
            // --- any column selected, need to check merged cell(s) starting left of selected column and ending at either selected column or right of selected column

            // Condition 1
            if (currentColumnIndex === 0) {
                let finalInsertArray: number[] = [1, 1]
                for (let i = 0; i < structureArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex, 0, finalInsertArray)
                }
                setStructureArray(shallowCopyStructureArray)
            } 
            // Condition 2
            else {
                let listOfCurrentMergePositionIni = []
                // left column only
                for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                    if ((shallowCopyStructureArray[i][currentColumnIndex][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) && (shallowCopyStructureArray[i][currentColumnIndex - 1][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex - 1][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([i, currentColumnIndex])
                    }
                }
                if (listOfCurrentMergePositionIni.length === 0) {
                    let finalInsertArray: number[] = [1, 1]
                    for (let i = 0; i < structureArray.length; i++) {
                        shallowCopyStructureArray[i].splice(currentColumnIndex, 0, finalInsertArray)
                    }
                    setStructureArray(shallowCopyStructureArray)
                } else {
                    let listOfMergePositionFinal = [] as number[][]
                    let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                    for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                        let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0]
                        if (newStartingMergedRowIndex < currentStartingMergedRowIndex) continue
    
                        // going through each affected row, starting at the top, check its structure value, if it's 0 (either col or row) move onto the next left column
                        // i.e. `listOfCurrentMergePositionIni[i][1] - 1 (counter)` -> check again
                        // if structure is not 0, get the row value -> it'll determine the next merge block
                        let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                        let condition: boolean = true;
                        let counter: number = 0;
                        while (condition) {
                            let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][0]
                            if (newStructureRowValue !== 0) {
                                if (currentColumnIndex - counter !== listOfCurrentMergePositionIni[i][1]) {
                                    if (structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][1] + currentColumnIndex - counter - 1 >= currentColumnIndex) {
                                        listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex - counter])
                                    }
                                }
                                currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                                condition = false
                            } else {
                                counter += 1
                            }
                        }
                    }
                    // with the list of starting position for merged cells that are affected by adding new column (left)
                    // accessing the structure (column) value and increment by 1
                    listOfMergePositionFinal.forEach((item: number[]) => {
                        const currentColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1]
                        const newColumnStructureValue = currentColumnStructureValue + 1
                        shallowCopyStructureArray[item[0]][item[1]][1] = newColumnStructureValue
                    })

                    // create a new structure column of [1,1]
                    // check if structure value at updatedColumnIndex + 1 (right side) is 0 -> meaning it's part of merged cell 
                    // AND structure value at updatedColumnIndex is not 1
                    // change affected existing merged cell to [0,0]
                    // if a cell/column is the starting merged row, skip it
                    let finalInsertArray: number[][] = Array(structureArray.length).fill([1,1])
                    for (let i = 0; i < listOfMergePositionFinal.length; i++) {
                        for (let j = 0; j < structureArray[listOfMergePositionFinal[i][0]][listOfMergePositionFinal[i][1]][0]; j++) {
                            finalInsertArray.splice(listOfMergePositionFinal[i][0] + j, 1, [0,0])
                        }
                    }


                    // insert structure to column left of selected column index
                    for (let i = 0; i < finalInsertArray.length; i++) {
                        shallowCopyStructureArray[i].splice(currentColumnIndex, 0, finalInsertArray[i])
                    }
                    setStructureArray(shallowCopyStructureArray)
                }
            }
        } else if (selectedCommand.includes('right')) {
            // Condition 1:
            // --- currentColumnIndex is 0 (first column selected), adding right would only require check between column 0 & 1
            // Condition 2:
            // --- currentColumnIndex is structureArray[0].length - 1 (last column selected), adding right doesn't affect any merged column
            // Condition 3:
            // --- any middle column, check if there's any merged cells between currentColumnIndex and IndexRight

            // Condition 1
            if (currentColumnIndex === 0) {
                let listOfCurrentMergePositionIni = []
                // right column only
                for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                    if ((shallowCopyStructureArray[i][currentColumnIndex][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) && (shallowCopyStructureArray[i][currentColumnIndex + 1][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex + 1][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([i, currentColumnIndex])
                    }
                }

                // if no merged cells found, add new column left of currentColumnIndex
                if (listOfCurrentMergePositionIni.length === 0) {
                    let finalInsertArray: number[] = [1, 1]
                    for (let i = 0; i < structureArray.length; i++) {
                        shallowCopyStructureArray[i].splice(currentColumnIndex + 1, 0, finalInsertArray)
                    }
                    setStructureArray(shallowCopyStructureArray)
                    return
                } 

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0]
                    if (newStartingMergedRowIndex < currentStartingMergedRowIndex) continue

                    // going through each affected row, starting at the top, check its structure value, if it's 0 (either col or row) move onto the next left column
                    // i.e. `listOfCurrentMergePositionIni[i][1] - 1 (counter)` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][0]
                        if (newStructureRowValue !== 0) {
                            listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex - counter])
                            currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                // with the list of starting position for merged cells that are affected by adding new column (right)
                // accessing the structure (column) value and increment by 1
                listOfMergePositionFinal.forEach((item: number[]) => {
                    const currentColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1]
                    const newColumnStructureValue = currentColumnStructureValue + 1
                    shallowCopyStructureArray[item[0]][item[1]][1] = newColumnStructureValue
                })

                // create a new structure column of [1,1]
                // check if structure value at updatedColumnIndex + 1 (right side) is 0 -> meaning it's part of merged cell 
                // AND structure value at updatedColumnIndex is not 1
                // change affected existing merged cell to [0,0]
                // if a cell/column is the starting merged row, skip it
                let finalInsertArray: number[][] = Array(structureArray.length).fill([1,1])
                for (let i = 0; i < structureArray.length; i++) {
                    if ((structureArray[i][currentColumnIndex + 1][0] !== 1 || structureArray[i][currentColumnIndex + 1][1] !== 1) && (structureArray[i][currentColumnIndex][0] !== 1 || structureArray[i][currentColumnIndex][1] !== 1)) {
                        finalInsertArray.splice(i, 1, [0,0])
                    }
                }

                // insert structure to column left of selected column index
                for (let i = 0; i < finalInsertArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentRowIndex + 1, 0, finalInsertArray[i])
                }

                setStructureArray(shallowCopyStructureArray)
            }
            // Condition 2
            else if (currentColumnIndex === structureArray[0].length - 1) {
                // create a new structure column of [1,1]
                let finalInsertArray: number[][] = Array(structureArray.length).fill([1,1])

                // insert structure to column left of selected column index
                for (let i = 0; i < finalInsertArray.length; i++) {
                    shallowCopyStructureArray[i].push(finalInsertArray[i])
                }
            }
            // Condition 3
            else {
                let listOfCurrentMergePositionIni = []
                // left or right column
                for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                    if ((shallowCopyStructureArray[i][currentColumnIndex][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) && ((shallowCopyStructureArray[i][currentColumnIndex - 1][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex - 1][1] !== 1) || (shallowCopyStructureArray[i][currentColumnIndex + 1][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex + 1][1] !== 1))) {
                        listOfCurrentMergePositionIni.push([i, currentColumnIndex])
                    }
                }
                // if no matching found, insert new column of [1,1]
                if (listOfCurrentMergePositionIni.length === 0) {
                    let finalInsertArray: number[] = [1, 1]
                    for (let i = 0; i < structureArray.length; i++) {
                        shallowCopyStructureArray[i].splice(currentColumnIndex + 1, 0, finalInsertArray)
                    }
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0]
                    if (newStartingMergedRowIndex < currentStartingMergedRowIndex) continue

                    // going through each affected row, starting at the top, check its structure value, if it's 0 (either col or row) move onto the next left column
                    // i.e. `listOfCurrentMergePositionIni[i][1] - 1 (counter)` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][0]
                        if (newStructureRowValue !== 0) {
                            if (structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][1] + currentColumnIndex - counter - 1 > currentColumnIndex) {
                                listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex - counter])
                            }
                            currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                // with the list of starting position for merged cells that are affected by adding new column (right)
                // accessing the structure (column) value and increment by 1
                listOfMergePositionFinal.forEach((item: number[]) => {
                    const currentColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1]
                    const newColumnStructureValue = currentColumnStructureValue + 1
                    shallowCopyStructureArray[item[0]][item[1]][1] = newColumnStructureValue
                })

                // create a new structure column of [1,1]
                // check if structure value at updatedColumnIndex + 1 (right side) is 0 -> meaning it's part of merged cell 
                // AND structure value at updatedColumnIndex is not 1
                // change affected existing merged cell to [0,0]
                // if a cell/column is the starting merged row, skip it
                let finalInsertArray: number[][] = Array(structureArray.length).fill([1,1])
                for (let i = 0; i < listOfMergePositionFinal.length; i++) {
                    for (let j = 0; j < structureArray[listOfMergePositionFinal[i][0]][listOfMergePositionFinal[i][1]][0]; j++) {
                        finalInsertArray.splice(listOfMergePositionFinal[i][0] + j, 1, [0,0])
                    }
                }


                // insert structure to column left of selected column index
                for (let i = 0; i < finalInsertArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex + 1, 0, finalInsertArray[i])
                }

                setStructureArray(shallowCopyStructureArray)
            }
        } else if (selectedCommand.includes('remove')) {
            // Condition 1: first column
            // --- move any merged row over to the right and subtract 1 to column structure value (-1)
            // Condition 2: last column
            // --- find affected merged cell(s), not including ones starting on last column, subtract 1 to column structure value (-1)
            // Condition 3: middle column
            // --- find affected merged cell(s),

            //Condition 1
            if (currentColumnIndex === 0) {
                let listOfCurrentMergePositionIni = []
                // get affected merged cell(s) if structure value is 0 at current column and right column (+1)
                for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                    if ((shallowCopyStructureArray[i][currentColumnIndex][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) && (shallowCopyStructureArray[i][currentColumnIndex + 1][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex + 1][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([i, currentColumnIndex])
                    }
                }
    
                // if no matching found, remove current column
                if (listOfCurrentMergePositionIni.length === 0) {
                    for (let i = 0; i < structureArray.length; i++) {
                        shallowCopyStructureArray[i].splice(currentColumnIndex, 1)
                    }
                    setStructureArray(shallowCopyStructureArray)
                    return
                }
    
                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0] 
                    if (listOfCurrentMergePositionIni[i][0] < currentStartingMergedRowIndex) continue
                    
                    let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                    let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex][0]
                    listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex])
                    currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                }

                // with the list of starting position for merged cells that are affected by removing current (1st) column
                // get the structure (column & row) value and decrease column value by 1
                // set it to the cell right adjecent of the current starting position
                listOfMergePositionFinal.forEach((item: number[]) => {
                    const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1] - 1
                    const newRowStructureValue = shallowCopyStructureArray[item[0]][item[1]][0]
                    shallowCopyStructureArray[item[0]].splice(item[1] + 1, 1, [newRowStructureValue, newColumnStructureValue])
                })

                // remove column structure of selected column index
                for (let i = 0; i < structureArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex, 1)
                }

                setStructureArray(shallowCopyStructureArray)
            }
            // Condition 2
            else if (currentColumnIndex === structureArray[0].length - 1) {
                let listOfCurrentMergePositionIni = []

                // get affected merged cell(s) if structure value is 0 at current column and left column (-1)
                for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                    if ((shallowCopyStructureArray[i][currentColumnIndex][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) && (shallowCopyStructureArray[i][currentColumnIndex - 1][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex - 1][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([i, currentColumnIndex])
                    }
                }
    
                // if no matching found, remove current column
                if (listOfCurrentMergePositionIni.length === 0) {
                    for (let i = 0; i < structureArray.length; i++) {
                        shallowCopyStructureArray[i].splice(currentColumnIndex, 1)
                    }
                    setStructureArray(shallowCopyStructureArray)
                    return
                }
    
                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0] 
                    if (listOfCurrentMergePositionIni[i][0] < currentStartingMergedRowIndex) continue

                    // going through each affected row, starting at the top, check its structure value, if it's 0 (either col or row) move onto the left column
                    // i.e. `listOfCurrentMergePositionIni[i][1] - 1` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][0]
                        if (newStructureRowValue !== 0) {
                            listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex - counter])
                            currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }
                // with the list of starting position for merged cells that are affected by removing current column
                // accessing the structure (column) value and decrease by 1
                // if the starting merged cell position is on the current column, skip it since it'll be remove anyway
                listOfMergePositionFinal.forEach((item: number[]) => {
                    if (item[1] !== currentColumnIndex) {
                        const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1] - 1
                        shallowCopyStructureArray[item[0]][item[1]].splice(1, 1, newColumnStructureValue)
                    } 
                })

                // insert structure to column left of selected column index
                for (let i = 0; i < structureArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex, 1)
                }

                setStructureArray(shallowCopyStructureArray)
            }
            // Condition 3
            else {
                let listOfCurrentMergePositionIni = []

                // get affected merged cell(s) if structure value is 0 at current column and (left column (-1) or right column (+1))
                for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                    if (
                        // current column
                        (shallowCopyStructureArray[i][currentColumnIndex][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) 
                        && 
                            // left column (-1)
                            ((shallowCopyStructureArray[i][currentColumnIndex - 1][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex - 1][1] !== 1) 
                            || 
                            // right column (+1)
                            (shallowCopyStructureArray[i][currentColumnIndex + 1][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex + 1][1] !== 1))
                        ) {
                        listOfCurrentMergePositionIni.push([i, currentColumnIndex])
                    }
                }
    
                // if no matching found, remove current column
                if (listOfCurrentMergePositionIni.length === 0) {
                    for (let i = 0; i < structureArray.length; i++) {
                        shallowCopyStructureArray[i].splice(currentColumnIndex, 1)
                    }
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0] 
                    if (listOfCurrentMergePositionIni[i][0] < currentStartingMergedRowIndex) continue

                    // going through each affected row, starting at the top, check its structure value, if it's 0 (either col or row) move onto the left column
                    // i.e. `listOfCurrentMergePositionIni[i][1] - 1` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][0]
                        if (newStructureRowValue !== 0) {
                            listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex - counter])
                            currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                // with the list of starting position for merged cells that are affected by removing current column
                // accessing the structure (column) value and decrease by 1
                // if the starting merged cell position is on the current column, note the row/column index, 
                // grab the structure value of both row and column (-1 for removing current column), 
                // insert the value into the row/column(+1)
                listOfMergePositionFinal.forEach((item: number[]) => {
                    if (item[1] === currentColumnIndex) {
                        const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1] - 1
                        const newRowStructureValue = shallowCopyStructureArray[item[0]][item[1]][0]
                        shallowCopyStructureArray[item[0]].splice(item[1] + 1, 1, [newRowStructureValue, newColumnStructureValue])
                    } else {
                        const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1] - 1
                        shallowCopyStructureArray[item[0]][item[1]][1] = newColumnStructureValue
                    }
                })

                // insert structure to column left of selected column index
                for (let i = 0; i < structureArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex, 1)
                }

                setStructureArray(shallowCopyStructureArray)
            }
        }

        setInputArray(shallowCopyInputArray)
        // moving current selected cell to the right (+1)
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
        const selectedCommand = (e.target as Element).id
        setRowMenuVisibility(false)
        const currentRowIndex: number = parseInt(cellSelected.split('-')[1])
        const shallowCopyInputArray = [...inputArray]
        const shallowCopyStructureArray = [...structureArray]

        if (selectedCommand.includes('remove')) {
            shallowCopyInputArray.splice(currentRowIndex, 1)
            setInputArray(shallowCopyInputArray)

            // structureArray
            // condition 1: first row
            // --- change all merged row to 2nd row and -1 to structure row value
            // condition 2: last row
            // --- change all merged row that's not on the last row and -1 to structure row value
            // condition 3: any middle row
            // --- change all merged row above that include current row AND move merged cell


            // Condition 1:
            if (currentRowIndex === 0) {
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex].length; i++) {
                    if ((shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) && (shallowCopyStructureArray[currentRowIndex + 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex + 1][i][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }

                // if empty, remove row
                if (listOfCurrentMergePositionIni.length === 0) {
                    shallowCopyStructureArray.splice(currentRowIndex, 1)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }
                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                    if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue
                    
                    let newStructureColumnValue: number = structureArray[currentRowIndex][newStartingMergedColumnIndex][1]
                    listOfMergePositionFinal.push([currentRowIndex, newStartingMergedColumnIndex])
                    currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                }

                // with the list of starting position for merged cells that are affected by inserting new row (above)
                // accessing the structure (row) value and increment it by 1
                // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                listOfMergePositionFinal.forEach((item: number[]) => {
                    const newRowStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] - 1
                    const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1]
                    shallowCopyStructureArray[item[0] + 1].splice(item[1], 1, [newRowStructureValue, newColumnStructureValue])
                })
                shallowCopyStructureArray.splice(currentRowIndex, 1)

                setStructureArray(shallowCopyStructureArray)

            }

            // Condition 2:
            else if (currentRowIndex === structureArray.length - 1) {
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex].length; i++) {
                    if ((shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) && (shallowCopyStructureArray[currentRowIndex - 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex - 1][i][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }

                // if empty, remove row
                if (listOfCurrentMergePositionIni.length === 0) {
                    shallowCopyStructureArray.splice(currentRowIndex, 1)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                    if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue

                    // going through each affected column, starting at the left, check its structure value, if it's 0 (either col or row) move onto the row above
                    // i.e. `listOfCurrentMergePositionIni[i][0] + 1` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureColumnValue: number = structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][1]
                        if (newStructureColumnValue !== 0) {
                            listOfMergePositionFinal.push([currentRowIndex - counter, newStartingMergedColumnIndex])
                            currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                // with the list of starting position for merged cells that are affected by inserting new row (above)
                // accessing the structure (row) value and increment it by 1
                // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                listOfMergePositionFinal.forEach((item: number[]) => {
                    if (item[0] !== currentRowIndex) {
                        const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] - 1
                        shallowCopyStructureArray[item[0]][item[1]][0] = newStructureValue
                    }
                })
                shallowCopyStructureArray.splice(currentRowIndex, 1)

                setStructureArray(shallowCopyStructureArray)
            }
            
            // Condition 3:
            else {
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex].length; i++) {
                    if (
                        (shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) 
                    && 
                    ((shallowCopyStructureArray[currentRowIndex - 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex - 1][i][1] !== 1) 
                    || (shallowCopyStructureArray[currentRowIndex + 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex + 1][i][1] !== 1))
                    ) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }

                // if empty, remove row
                if (listOfCurrentMergePositionIni.length === 0) {
                    shallowCopyStructureArray.splice(currentRowIndex, 1)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                    if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue

                    // going through each affected column, starting at the left, check its structure value, if it's 0 (either col or row) move onto the row above
                    // i.e. `listOfCurrentMergePositionIni[i][0] + 1` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureColumnValue: number = structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][1]
                        if (newStructureColumnValue !== 0) {
                            listOfMergePositionFinal.push([currentRowIndex - counter, newStartingMergedColumnIndex])
                            currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                // with the list of starting position for merged cells that are affected by inserting new row (above)
                // accessing the structure (row) value and increment it by 1
                // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                listOfMergePositionFinal.forEach((item: number[]) => {
                    if (item[0] !== currentRowIndex) {
                        const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] - 1
                        shallowCopyStructureArray[item[0]][item[1]][0] = newStructureValue
                    } else if (item[0] === currentRowIndex) {
                        const newRowStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] - 1
                        const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1]
                        shallowCopyStructureArray[item[0] + 1].splice(item[1], 1, [newRowStructureValue, newColumnStructureValue])
                    }
                })
                shallowCopyStructureArray.splice(currentRowIndex, 1)

                setStructureArray(shallowCopyStructureArray)
            }
        } else {
            const numberOfColumn = inputArray[0].length
            const newRow = Array(numberOfColumn).fill('')
            // --------------------------------- above ------------------------------------
            if (selectedCommand.includes('above')) {
                shallowCopyInputArray.splice(currentRowIndex, 0, newRow)
                const selectedCellArray = cellSelected.split('-')
                selectedCellArray[1] = String(currentRowIndex + 1)
                setCellSelected(selectedCellArray.join('-'))
                setInputArray(shallowCopyInputArray)

                // -------------- structureArray ------------------
                // Condition 1:
                // --- first row selected, add new row above doesn't affect any merged cells
                // Condition 2:
                // --- any row selected, add new row above, check if sum of merged cells start position and structure row value is greater than or equal to current selected row index

                // Condition 1:
                if (currentRowIndex === 0) {
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    shallowCopyStructureArray.splice(currentRowIndex, 0, finalInsertArray)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                // Condition 2:
                // finding if there's any column affected by adding new row at current row index
                // check if structureArray of rowValue at currentRowIndex and different columnIndexes isn't 1
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex].length; i++) {
                    if ((shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) && (shallowCopyStructureArray[currentRowIndex - 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex - 1][i][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }

                // if no matching found, insert new row of [1,1]
                if (listOfCurrentMergePositionIni.length === 0) {
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    shallowCopyStructureArray.splice(currentRowIndex, 0, finalInsertArray)
                    setStructureArray(shallowCopyStructureArray)
                } else {
                    let listOfMergePositionFinal = [] as number[][]
                    let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                    for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                        let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                        if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue
    
                        // going through each affected column, starting at the left, check its structure value, if it's 0 (either col or row) move onto the row above
                        // i.e. `listOfCurrentMergePositionIni[i][0] + 1` -> check again
                        // if structure is not 0, get the row value -> it'll determine the next merge block
                        let condition: boolean = true;
                        let counter: number = 0;
                        while (condition) {
                            let newStructureColumnValue: number = structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][1]
                            if (newStructureColumnValue !== 0) {
                                if (currentRowIndex !== currentRowIndex - counter) {
                                    listOfMergePositionFinal.push([currentRowIndex - counter, newStartingMergedColumnIndex])
                                }
                                currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                                condition = false
                            } else {
                                counter += 1
                            }
                        }
                    }

                    // create a new structure row of [1,1]
                    // change affected existing merged column to [0,0]
                    // if a cell/column is the starting merged column, skip it
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    for (let i = 0; i < listOfMergePositionFinal.length; i++) {
                        for (let j = 0; j < structureArray[listOfMergePositionFinal[i][0]][listOfMergePositionFinal[i][1]][1]; j++) {
                            finalInsertArray.splice(listOfMergePositionFinal[i][1] + j, 1, [0,0])
                        }
                    }

                    // with the list of starting position for merged cells that are affected by inserting new row (above)
                    // accessing the structure (row) value and increment it by 1
                    // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                    listOfMergePositionFinal.forEach((item: number[]) => {
                        if (item[0] !== currentRowIndex) {
                            const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] + 1
                            shallowCopyStructureArray[item[0]][item[1]][0] = newStructureValue
                        }
                    })
                    shallowCopyStructureArray.splice(currentRowIndex, 0, finalInsertArray)
    
                    setStructureArray(shallowCopyStructureArray)
                }
            } else if (selectedCommand.includes('below')) {
                shallowCopyInputArray.splice(currentRowIndex + 1, 0, newRow)
                setInputArray(shallowCopyInputArray)

                // structureArray
                // Condition 1:
                // --- if selected row is last row, adding row below doesn't affect any merged cell
                // Condition 2:
                // --- any selected row, check structure row value of current row and row below

                // Condition 1:
                // if last row, add row below doesn't affect anything, insert new row of [1,1]
                if (currentRowIndex === structureArray.length - 1) {
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    shallowCopyStructureArray.splice(currentRowIndex + 1, 0, finalInsertArray)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                // Condition 2:
                // finding if there's any column affected by adding new row at current row index + 1 (for row below)
                // check if structureArray of rowValue at currentRowIndex and different columnIndexes isn't 1
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex + 1].length; i++) {
                    if ((shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) && (shallowCopyStructureArray[currentRowIndex + 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex + 1][i][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }
                // if no matching found, insert new row of [1,1]
                if (listOfCurrentMergePositionIni.length === 0) {
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    shallowCopyStructureArray.splice(currentRowIndex + 1, 0, finalInsertArray)
                    setStructureArray(shallowCopyStructureArray)
                } else {
                    let listOfMergePositionFinal = [] as number[][]
                    let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                    for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                        let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                        if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue
    
                        // going through each affected column, starting at the left, check its structure value, if it's 0 (either col or row) move onto the row above
                        // i.e. `listOfCurrentMergePositionIni[i][0] + 1` -> check again
                        // if structure is not 0, get the row value -> it'll determine the next merge block
                        let condition: boolean = true;
                        let counter: number = 0;
                        while (condition) {
                            let newStructureColumnValue: number = structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][1]
                            if (newStructureColumnValue !== 0) {
                                if (structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][0] + currentRowIndex - counter - 1 > currentRowIndex) {
                                    listOfMergePositionFinal.push([currentRowIndex - counter, newStartingMergedColumnIndex])
                                }
                                currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                                condition = false
                            } else {
                                counter += 1
                            }
                        }
                    }
                    // create a new structure row of [1,1]
                    // change affected existing merged column to [0,0]
                    // if a cell/column is the starting merged column, skip it
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    for (let i = 0; i < listOfMergePositionFinal.length; i++) {
                        for (let j = 0; j < structureArray[listOfMergePositionFinal[i][0]][listOfMergePositionFinal[i][1]][1]; j++) {
                            finalInsertArray.splice(listOfMergePositionFinal[i][1] + j, 1, [0,0])
                        }
                    }

                    // with the list of starting position for merged cells that are affected by inserting new row (above)
                    // accessing the structure (row) value and increment it by 1
                    // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                    listOfMergePositionFinal.forEach((item: number[]) => {
                        if (item[0] + structureArray[item[0]][item[1]][0] - 1 > currentRowIndex) {
                            const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] + 1
                            shallowCopyStructureArray[item[0]][item[1]][0] = newStructureValue
                        }
                    })

                    shallowCopyStructureArray.splice(currentRowIndex + 1, 0, finalInsertArray)
    
                    setStructureArray(shallowCopyStructureArray)
                }
            }
        }
    }

    const handleCellMenu = (e: React.MouseEvent) : void => {
        if (!cellSelected) {
            return
        }
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

        if (structureArray[parseInt(cellSelected.split('-')[1])][parseInt(cellSelected.split('-')[2])][0] !== 1) {
            return
        }

        if (newColumnStructureValue <= 1 && newRowStructureValue <= 1) {
            setMergeModalStatus(false)
            let form = document.getElementById('mergeForm')
            if(form) (form as HTMLFormElement).reset();
            return
        }
        
        const selectedColumnIndex: number = parseInt(cellSelected.split('-')[2])
        const selectedRowIndex: number = parseInt(cellSelected.split('-')[1])

        // if input column or row value is out of range
        // return alert
        if (selectedColumnIndex + newColumnStructureValue > structureArray[0].length || selectedRowIndex + newRowStructureValue > structureArray.length) {
            return
        }
        
        // if input column or row value overlap any current merged cell(s)
        // return alert
        for (let i = 0; i < newRowStructureValue; i++) {
            for (let j = 0; j < newColumnStructureValue; j++) {
                if (structureArray[selectedRowIndex + i][selectedColumnIndex + j][0] !== 1 || structureArray[selectedRowIndex + i][selectedColumnIndex + j][1] !== 1) {
                    return
                }
            }
        }

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
                <div className="modal-overlay">
                    <div className="merge-modal" id="merge-modal">
                        <form onSubmit={handleMergeSubmit} id="mergeForm">
                            <h3>Merge tool:</h3>
                            <p>Column span:</p>
                            <input type="number" id="merge-column" name="mergeColumnValue" defaultValue={1} min={1} style={{width: '100%'}} />
                            <p>Row span:</p>
                            <input type="number" id="merge-row" name="mergeRowValue" defaultValue={1} min={1} style={{width: '100%'}} />
                            <div style={{marginTop: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-evenly'}}>
                                <button type="submit" className="modalButton">Merge</button>
                                <button onClick={() => setMergeModalStatus(false)} className="modalButton">Back</button>
                            </div>
                        </form>
                    </div>
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
                <td key={`${rowIndex}-${columnIndex}`} id={`cell-${rowIndex}-${columnIndex}`} className={isCellSelected(`cell-${rowIndex}-${columnIndex}`) ? "selectedCell" : "spreadsheet-tbody-tr-td"} onClick={handleOnSelected} colSpan={columnStructureValueAtIndex} rowSpan={rowStructureValueAtIndex} style={{textAlign: 'center'}}>
                {structureArray[rowIndex][columnIndex][0] > 1 || structureArray[rowIndex][columnIndex][1] > 1 ? `${structureArray[rowIndex][columnIndex][0]} x ${structureArray[rowIndex][columnIndex][1]}` : ''}
                </td>
            )
        }
    }

    const handleCopyButton = () => {
        navigator.clipboard.writeText(codeBlockData)
        setCopyDataState(true)
    }

    const codeBlockRender = () => {
        return (
            <div className="codeBlockStyles">
                <div className="codeBlockHeaderStyles">
                    <p>Code block:</p>
                    {copyDataState ? 
                    <div className="copiedDivStyle">
                        <IonIcon name="checkmark-outline"></IonIcon>
                        <span>Copied!</span>
                    </div>
                     : <button className="codeBlockCopyButtonStyle" onClick={handleCopyButton}>
                        <IonIcon name="clipboard-outline"></IonIcon>
                        <span>Copy Code</span>
                    </button>
                    }
                    
                </div>
                <SyntaxHighlighter language="Javascript" style={arta} lineProps={{style: {wordBreak: 'break-all', whiteSpace: 'pre-wrap', paddingLeft: '10px'}}} wrapLines={true} >
                    {codeBlockData}
                </SyntaxHighlighter>
            </div>
        )
    }

    return (
        <>
            <div className="spreadsheet-div">
                <div className="spreadsheet-menus-div">
                    <div className="dropdown" id='column-dropdown-div' onMouseEnter={() => setCellMenuVisibility(true)} onMouseLeave={() => setCellMenuVisibility(false)}>
                        <button className="dropbtn" id="cell-dropdown-button">Cell</button>
                        {cellMenuVisibility &&<div className="dropdown-content" id='cell-dropdown-content'>
                            <p id="merge-cell" onClick={handleCellMenu}>Merge</p>
                            <p id="split-cell" onClick={handleCellMenu}>Split</p>
                        </div>}
                    </div> 
                    <div className="dropdown" id='column-dropdown-div' onMouseEnter={() => setColumnMenuVisibility(true)} onMouseLeave={() => setColumnMenuVisibility(false)}>
                        <button className="dropbtn" id='column-dropdown-button'>Column</button>
                        {columnMenuVisibility && <div className="dropdown-content" id='column-dropdown-content'>
                            <p id="add-column-left" onClick={handleColumnMenu}>Add column (left)</p>
                            <p id="add-column-right" onClick={handleColumnMenu}>Add column (right)</p>
                            <p id="remove-column" onClick={handleColumnMenu}>Remove column</p>
                        </div>}
                    </div> 
                    <div className="dropdown" onMouseEnter={() => setRowMenuVisibility(true)} onMouseLeave={() => setRowMenuVisibility(false)}>
                        <button className="dropbtn">Row</button>
                        {rowMenuVisibility && <div className="dropdown-content" id='row-dropdown-content'>
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
                            {structureArray[0] && structureArray[0].map((_, index) => {
                                return (
                                    <th key={`header-${index}`} className="spreadsheet-thead-tr-td">{index + 1}</th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody className="spreadsheet-tbody">
                        {structureArray[0] && structureArray.map((row, rowIndex) => {
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
                <div className="codeBlockAndAboutDiv">
                    <div className="codeBlockDiv">
                        {codeBlockRender()}
                    </div>
                    <div className="aboutDiv">
                        <p>About this tool</p>
                        <h3>MergeScript Express</h3>
                        <p>MergeScript Express is designed to streamline the process of generating JavaScript code compatible with the SheetJS package, focusing particularly on merging cells functionality. With our intuitive interface, users can effortlessly create the necessary code snippets tailored to their merging requirements, saving time and ensuring compatibility with SheetJS. MergeScript Express simplifies the task of incorporating merging cells functionality into your projects.</p>
                        <br />
                        <h3>Why this tool?</h3>
                        <p>I developed this tool with a primary goal: to learn TypeScript and strengthen my knowledge of React Framework. I chose Excel merge feature because of its substancial challenge, one that I embraced as an opportunity to enhance my problem-solving skills and deepen my understanding of data manipulation. I've tackled each development stage with dedication, aiming to better these technologies and grow my expertise in the web development field. </p>
                    </div>
                </div>
            </div>
            {mergeModal()}
        </>
    )
}

export default Spreadsheet;