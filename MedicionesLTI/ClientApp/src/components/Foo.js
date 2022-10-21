import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useReactToPrint } from "react-to-print";
import Chart from "react-apexcharts";

import { Container, Row, Col, Button, Spinner, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const OutcomeToPrint = React.forwardRef((props, ref) => {
    return (
        <div className="parent" ref={ref}>
            <style type="text/css" media="print">
                {"\
                    @page { size: landscape; }\
                    @media all {\
                        .hide {\
                            display: block;\
                        }\
                    }\
                    @media print {\
                        .hide {\
                            display: block;\
                        }\
                    }\
                "}
            </style>
            <div className={props.isTabulationAndGraphs ? "n-hide" : "hide"}>
                <table>
                    {props.tabulationAndGraphsTable}
                </table>
                <br />
                <br />
                <div>
                    <Row className="mt-10 mb-10">
                        <Col xs="12" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            {props.renderCourseGoalByOutcomeRow}
                        </Col>
                    </Row>
                </div>
                <br />
                <br />
                <div id="chart">
                    <Chart
                        options={props.chartData.options}
                        series={props.chartData.series}
                        type="bar"
                        width="100%"
                        height={380}
                    />
                </div>
            </div>
            <div className={props.isResultsAndImprovements ? "n-hide" : "hide"}>
                <table>
                    {props.resultsAndImprovementsTable}
                </table>
            </div>
        </div>
    );
});

const Foo = () => {
    const componentRef = useRef(null);

    const location = useLocation();
    const params = new URLSearchParams(location.search);

    const baseAPIUrl = 'https://localhost:44324';
    //const baseAPIUrl = 'https://testltimediciones.espol.edu.ec';
    const analyticsAPIUrl = baseAPIUrl + '/api/outcomes';
    const routesAPIUrl = baseAPIUrl + '/api/routes';
    const canvasAPIUrl = baseAPIUrl + '/api/canvas';

    const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Content-Type': 'application/json'
    });
    const userId = params.get('user_id');
    const courseId = params.get('course_id');

    
    // Outcome Performances
    const UNSATISFACTORY = "Unsatisfactory";
    const DEVELOPING = "Developing";
    const SATISFACTORY = "Satisfactory";
    const EXEMPLARY = "Exemplary";
    const performance = [UNSATISFACTORY, DEVELOPING, SATISFACTORY, EXEMPLARY];
    const totalByOutcome = 0;

    const resultsAndImprovementsHeaderRow = [
        "Factores a mejorar ",
        "Cuál es la acción de mejora?",
        "Cuándo se implementará la mejora? (opcional)",
        "Cómo se sugiere la implementación? (opcional)",
        "Quién es el responsible de la acción de mejora? (opcional)",
        "Observaciones"
    ];
    const resultsAndImprovementsHeaderColumn = [
        "Desde la formación del resultado de aprendizaje del programa",
        "Desde la formación del resultado de aprendizaje del curso",
        "Desde el instrumento de medición"
    ];

    const minCourseGoal = 0;
    const maxCourseGoal = 100;
    const [courseGoal, setCourseGoal] = useState(70);
    const yAnnotation = {
        y: parseFloat(courseGoal),
        borderColor: '#ff0000',
        strokeDashArray: 0,
        label: {
            borderColor: '#000',
            style: {
                color: '#fff',
                background: '#ff0000'
            },
            text: 'Meta Curso',
            offsetX: 0,
            offsetY: 0
        },
        offsetX: 0,
        offsetY: 0
    };
    const initialChartData = {
        series: [],
        options: {
            annotations: {
                yaxis: [yAnnotation]
            },
            chart: {
                type: 'bar',
                height: 350
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    endingShape: 'rounded',
                    dataLabels: {
                        position: 'top'
                    }
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return val + "%";
                },
                offsetY: -20,
                style: {
                    fontSize: '12px',
                    colors: ["#304758"]
                }
            },
            legend: {
                position: "right",
                horizontalAlign: "left",
                markers: {
                    fillColors: ['#ff0000', '#f8ff00', '#72ff4f', '#00ba54']
                }
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: [],
                title: {
                    text: 'Citeria Type'
                }
            },
            yaxis: {
                min: 0,
                max: 100,
                tickAmount: 10,
                title: {
                    text: 'Student Percentage'
                },
                labels: {
                    formatter: (val) => val + "%"
                }
            },
            fill: {
                colors: ['#ff0000', '#f8ff00', '#72ff4f', '#00ba54'],
                opacity: 1
            },
            title: {
                text: "Analysis of measurement and evaluation",
                align: 'center',
                style: {
                    fontSize: '18px'
                },
            }
        },
    };


    // CanvasLMS
    const [isStudentsLoaded, setStudentsIsLoaded] = useState(false);
    const [studentItems, setStudentItems] = useState([]);

    //const [teachers, setTeachers] = useState([]);
    const [course, setCourse] = useState({});
    const [assignedOutcomeGroups, setAssignedOutcomeGroups] = useState([]);
    const [selectedOutcomeGroup, setSelectedOutcomeGroup] = useState({});
    const [allOutcomes, setAllOutcomes] = useState({});
    const [selectedOutcomes, setSelectedOutcomes] = useState([]);
    const [outcomeRollups, setOutcomeRollups] = useState({});
    const [performanceSummary, setPerformanceSummary] = useState({});
    const [chartData, setChartData] = useState(initialChartData);
    const [isTabulationAndGraphs, setIsTabulationAndGraphs] = useState(true);
    const [isResultsAndImprovements, setIsResultsAndImprovements] = useState(true);
    const [resultsAndImprovementsData, setResultsAndImprovementsData] = useState({});
    const [ri, setRI] = useState([0, -1, -1]); // [x, y, z]
    const [modal, setModal] = useState(false);
    const [modalText, setModalText] = useState(false);

    // Rutas Mediciones
    const [isSyncRM, setIsSyncRM] = useState(false);
    const [outcomesRM, setOutcomesRM] = useState([]);
    const [selectorOutcomesRM, setSelectorOutcomesRM] = useState([]);
    const [selectedOutcomeRM, setSelectedOutcomeRM] = useState({});

    /*
        Effects
    */

    useEffect(() => {
        //fetchTeachers();
        fetchCourse();
        fetchStudents();
        fetchOutcomeRollups();
    }, []);

    useEffect(() => {
        if (course && Object.keys(course).length > 0) {
            fetchOutcomesRM();
        }
    }, [course]);

    useEffect(() => {
        if (outcomesRM && selectedOutcomeRM) {
            fetchAssignedOutcomeGroups();
        }
    }, [outcomesRM, selectedOutcomeRM]);

    useEffect(() => {
        assignedOutcomeGroups?.map(o => fetchOutcomes(o?.id));
    }, [assignedOutcomeGroups]);

    useEffect(() => {
        if (studentItems &&
            studentItems.length > 0 &&
            selectedOutcomes &&
            Object.keys(selectedOutcomes).length > 0) {

            window.setTimeout(() => {
                const performanceSummaryUpdated = { ...performanceSummary };
                studentItems?.map((student) => {
                    selectedOutcomes?.map((so) => {
                        const oStudent = outcomeRollups[student.id] ?? {};
                        const oRollup = oStudent[so.outcome?.id] ?? {};
                        const perfIndex = so.outcome.ratings?.findIndex((rate) => rate.points === oRollup?.score);
                        const perf = performance[(performance.length - 1) - perfIndex] ?? "";

                        const outcomePerfSummary = performanceSummaryUpdated[so.outcome?.id] ?? {};
                        if (outcomePerfSummary && Object.keys(outcomePerfSummary).length > 0 && perf) {
                            performanceSummaryUpdated[so.outcome.id][perf] = outcomePerfSummary[perf] + 1;
                        }
                    })
                });
                console.log('Before', performanceSummary);
                setPerformanceSummary(performanceSummaryUpdated);
                console.log('After', performanceSummary);
            }, 1000);
        }
    }, [studentItems, selectedOutcomes]);

    useEffect(() => {
        if (selectedOutcomeGroup &&
            Object.keys(selectedOutcomeGroup).length > 0 &&
            Object.keys(allOutcomes).length === assignedOutcomeGroups.length) {
            const perfSumm = {}
            const sOutcomes = allOutcomes[selectedOutcomeGroup.id];

            sOutcomes?.map((o) => perfSumm[o?.outcome?.id] = { "Unsatisfactory": 0, "Developing": 0, "Satisfactory": 0, "Exemplary": 0 });
            setPerformanceSummary(perfSumm);

            setSelectedOutcomes(sOutcomes);
        }
    }, [allOutcomes]);

    useEffect(() => {
        if (performanceSummary &&
            Object.keys(performanceSummary).length > 0) {
            const unsatisfactoryValues = [];
            const developingValues = [];
            const satisfactoryValues = [];
            const exemplaryValues = [];
            const chartXCategories = [];

            selectedOutcomes.map((o, idx) => {
                const ps = performanceSummary[o.outcome.id] ?? {};
                const unsatisfactoryTotal = (ps["Unsatisfactory"] / studentItems.length) * 100
                unsatisfactoryValues.push(unsatisfactoryTotal.toFixed(1));

                const developingTotal = (ps["Developing"] / studentItems.length) * 100;
                developingValues.push(developingTotal.toFixed(1));

                const satisfactoryTotal = (ps["Satisfactory"] / studentItems.length) * 100;
                satisfactoryValues.push(satisfactoryTotal.toFixed(1));

                const exemplaryTotal = (ps["Exemplary"] / studentItems.length) * 100;
                exemplaryValues.push(exemplaryTotal.toFixed(1));

                chartXCategories.push('Performance Criteria' + (idx + 1));
            });

            const chartSeries = [{
                name: 'Unsatisfactory',
                data: unsatisfactoryValues
            }, {
                name: 'Developing',
                data: developingValues
            }, {
                name: 'Satisfactory',
                data: satisfactoryValues
            }, {
                name: 'Exemplary',
                data: exemplaryValues
            }];

            const data = {
                series: chartSeries,
                options: {
                    xaxis: {
                        categories: chartXCategories
                    }
                }
            };
            setChartData(prevState => {
                return { ...prevState, ...data }
            });
        } else {
            setChartData(initialChartData);
        }
    }, [performanceSummary]);

    useEffect(() => {
        if (resultsAndImprovementsData && Object.keys(resultsAndImprovementsData).length > 0 &&
            selectedOutcomeGroup && Object.keys(selectedOutcomeGroup).length > 0) {
            const requestOptions = {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ "outcomeId": selectedOutcomeGroup.id, "row": JSON.stringify(resultsAndImprovementsData) })
            };
            fetch(`${analyticsAPIUrl}/observation/`, requestOptions);
        }
    }, [resultsAndImprovementsData]);

    useEffect(() => {
        if (selectedOutcomeGroup && Object.keys(selectedOutcomeGroup).length > 0) {
            fetch(`${analyticsAPIUrl}/${selectedOutcomeGroup.id}/observation/`, {
                headers: headers
            })
                .then(res => res.json())
                .then(
                    (result) => {
                        var data = {}
                        if (result && Object.keys(result).length > 0) {
                            data = JSON.parse(result?.row);
                        }
                        setResultsAndImprovementsData(data);
                    },
                    (error) => {
                        showMessage(error);
                    }
                )
        }
    }, [selectedOutcomeGroup]);


    /*
        Handles
    */
    const showMessage = (body) => toast(body);

    const handleCourseGoal = e => {
        const newCourseGoal = parseFloat(Math.max(minCourseGoal,
            Math.min(maxCourseGoal, Number(event.target.value))));
        setCourseGoal(newCourseGoal);

        yAnnotation.y = newCourseGoal;
        const courseGoalData = {
            options: {
                annotations: {
                    yaxis: [yAnnotation]
                }
            }
        };
        setChartData(prevState => {
            return { ...prevState, ...courseGoalData }
        });
    };

    const handleAddResultsAndImprovements = (x, y, z, value) => {
        // x -> The rowHeader position of observation type  [0, 1 or 2]
        // y -> The observation position [0, ..., n]
        // z -> The columnHeader position of observation type [0, 1 , 2, 3, 4, 5, 6]

        const newData = {};
        var data = resultsAndImprovementsData[x] ?? [];
        newData[x] = [];
        if (y === -1 && z === -1) {
            data.push({});
            newData[x] = data;
            setResultsAndImprovementsData(prevState => {
                return { ...prevState, ...newData }
            });
        } else {
            const zData = data[y] ?? {}
            zData[z] = value;
            data[y] = zData;
            newData[x] = data;
            setResultsAndImprovementsData(prevState => {
                return { ...prevState, ...newData }
            });
        }
    }

    const handleDeleteResultsAndImprovements = (x, y, z) => {
        // x -> The rowHeader position of observation type  [0, 1 or 2]
        // y -> The observation position [0, ..., n]
        // z -> The columnHeader position of observation type [0, 1 , 2, 3, 4, 5, 6]

        const newData = {};
        var data = resultsAndImprovementsData[x] ?? [];
        newData[x] = [];
        if (z === -1) {
            data.splice(y, 1);
            newData[x] = data;
            setResultsAndImprovementsData(prevState => {
                return { ...prevState, ...newData }
            });
        }
    }

    const handleModal = (x, y, z, value) => {
        setRI([x, y, z]);
        setModalText(value);
        setModal(true);
    };
    const handleModalSubmit = () => {
        setModal(false);
        handleAddResultsAndImprovements(ri[0], ri[1], ri[2], modalText);
    };

    const toggleModal = () => setModal(!modal);

    const fetchCourse = async () => {
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}`, {
            headers: headers
        })
            .then(res => res.json())
            .then(
                (result) => {
                    result['sis_course_id'] = 147142; //147119;
                    setCourse(result);
                    console.log('Curso', result);
                },
                (error) => {
                    console.log('Curso', error);
                    setCourse({});
                    showMessage(error);
                }
            )
    }

    // RutasMediciones - List Outcomes by Course
    const fetchOutcomesRM = async () => {
        const response = await fetch(`${routesAPIUrl}/${course?.sis_course_id}`, {
            headers: headers
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setOutcomesRM(result);
                    const selectorsORM = result?.map(outcomeRM => {
                        return { 'value': outcomeRM.id, 'label': outcomeRM.title }
                    });
                    setSelectedOutcomeRM(selectorsORM[0]);
                    setSelectorOutcomesRM(selectorsORM);
                },
                (error) => {
                    setOutcomesRM([]);
                    setSelectorOutcomesRM([]);
                    setSelectedOutcomeRM({});
                    showMessage(error);
                }
            )

    };

    const fetchStudents = async () => {
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}/users/`, {
            headers: headers
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setStudentsIsLoaded(true);
                    setStudentItems(result);
                },
                (error) => {
                    setStudentsIsLoaded(true);
                    showMessage(error);
                }
            )

    }

    const fetchOutcomeRollups = async () => {
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_rollups/`, {
            headers: headers
        })
            .then(res => res.json())
            .then(
                (result) => {
                    // Map by student -> outcomes -> score
                    const rollups = {};
                    result?.rollups?.map((studentRollup) => {
                        rollups[parseInt(studentRollup.links.user)] = {};
                        studentRollup.scores.map((score) => {
                            rollups[parseInt(studentRollup.links.user)][parseInt(score.links.outcome)] = score;
                        });
                    });
                    setOutcomeRollups(rollups);
                },
                (error) => {
                    setOutcomeRollups({});
                    showMessage(error);
                }
            )

    }

    // CanvasLMS - List Outcome Groups (List Outcomes)
    const fetchAssignedOutcomeGroups = async () => {
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_groups/`, {
            headers: headers
        })
            .then(res => res.json())
            .then(
                (result) => {
                    const titlesORM = outcomesRM?.map(o => o.title);
                    const assignedOGs = result?.filter(o => titlesORM.includes(o.title));
                    setAssignedOutcomeGroups(assignedOGs);

                    const selectedOG = assignedOGs?.filter(o => o.title === selectedOutcomeRM.label)[0];
                    setSelectedOutcomeGroup(selectedOG);
                    
                },
                (error) => {
                    setAssignedOutcomeGroups([])
                    showMessage(error);
                }
            )
    }

    // CanvasLMS - List Outcomes by Outcome Group (List Criteria)
    const fetchOutcomes = async (outcomeGroupId) => {
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_groups/${outcomeGroupId}/outcomes/`, {
            headers: headers
        })
            .then(res => res.json())
            .then(
                (result) => {
                    const data = {};
                    data[outcomeGroupId] = result;
                    setAllOutcomes(prevState => {
                        return { ...prevState, ...data }
                    });
                },
                (error) => {
                    setAllOutcomes({});
                    showMessage(error);
                }
            )
    }

    const syncRM = async () => {
        // Starting
        setIsSyncRM(true);

        try {
            // Fetch outcome groups from canvas
            const respOutcomeGroups = await fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_groups/`, {
                headers: headers
            });
            const outcomeGroups = await respOutcomeGroups.json();
            const parentOutcomeGroup = outcomeGroups[0];

            // Fetch outcomes from routes system
            const respOutcomesRM = await fetch(`${routesAPIUrl}/${course?.sis_course_id}`);
            const outcomesRM = await respOutcomesRM.json();

            outcomesRM?.map(outcomeRM => {
                const isSync = false;
                outcomeGroups?.map(outcomeGroup => {
                    if (outcomeRM.title === outcomeGroup.title) { isSync = true };
                });

                if (!isSync) {
                    const requestOptions = {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ title: outcomeRM.title, vendorId: outcomeRM.id })
                    };
                    fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_groups/${parentOutcomeGroup.id}/subgroups/`, requestOptions);
                }
            });
        } catch (e) { console.log(e) }

        // Ending
        setIsSyncRM(false);
        showMessage("Se ha sincronizado los SO correctamente!");
    }

    const getCriterioGradeRow = (perf, bgColor) => {
        return (
            <>
                <td className={`center ${bgColor}`}>{perf === UNSATISFACTORY ? "1" : "-"}</td>
                <td className={`center ${bgColor}`}>{perf === DEVELOPING ? "1" : "-"}</td>
                <td className={`center ${bgColor}`}>{perf === SATISFACTORY ? "1" : "-"}</td>
                <td className={`center ${bgColor}`}>{perf === EXEMPLARY ? "1" : "-"}</td>
            </>
        )
    }

    // Print PDF
    const reactToPrintContent = useCallback(() => {
        return componentRef.current;
    }, [componentRef.current]);

    const handlePrint = useReactToPrint({
        content: reactToPrintContent,
        documentTitle: "AwesomeFileName",
        removeAfterPrint: true,
        onBeforePrint: () => {
            //setTabulationAndGraphs(true);
            //setResultsAndImprovements(true);
        }
    });

    const getTypeRM = useCallback(() => {
        const currentRM = outcomesRM.filter((o) => {
            if (o.id === selectedOutcomeRM.value) return o;
        })[0];
        return currentRM?.type ?? "N/A";
    }, [selectedOutcomeRM]);

    const renderTitlePerformanceHeader = (idx) => {
        return <th className="center bgDarkGreen tWhite" colSpan={4}>{"Performance Criteria " + (idx + 1)}</th>
    };

    const renderPerformanceColumns = useMemo(() => {
        return performance?.map(p => <th className="center bgLightGreen tWhite">{p}</th>)
    }, [performance]);

    const renderOutcomeHeader = useMemo(() => {
        if (selectedOutcomes?.length > 0) {
            const titleOutcomeHeader = selectedOutcomes?.map((o, idx) => renderTitlePerformanceHeader(idx));
            const outcomeHeaders = selectedOutcomes?.map(o => <th className="center bgDarkGreen tWhite" colSpan={performance?.length ?? 1}>{o?.outcome.title}</th>);
            const performanceHeaders = selectedOutcomes?.map(o => renderPerformanceColumns);
            return (
                <>
                    <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        {titleOutcomeHeader}
                    </tr>
                    <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        {outcomeHeaders}
                    </tr>
                    <tr>
                        <th className="center bgDarkGray">Nº</th>
                        <th className="center bgDarkGray">Id</th>
                        <th className="center bgDarkGray">Student Name</th>
                        {performanceHeaders}
                    </tr>
                </>
            );
        }
        return <></>;
    }, [selectedOutcomes]);

    const renderStudentRow = (student, key) => {
        const bgColor = (key + 1) % 2 == 0 ? "bgLightGray" : "bgDarkGray";
        return (
            <tr>
                <td className={`center ${bgColor}`}>{key + 1}</td>
                <td className={`center ${bgColor}`}>{student.sis_user_id}</td>
                <td className={bgColor}>{student.name}</td>

                {selectedOutcomes?.map((so) => {
                    const oStudent = outcomeRollups[student.id] ?? {};
                    const oRollup = oStudent[so.outcome?.id] ?? {};
                    const perfIndex = so.outcome.ratings?.findIndex((rate) => rate.points === oRollup?.score);
                    const perf = performance[(performance.length - 1) - perfIndex] ?? "";
                    return getCriterioGradeRow(perf, bgColor);
                })}
            </tr>
        );
    }

    const renderPerformanceSummaryRow = useMemo(() => {
        return (
            <>
                <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    {selectedOutcomes.map((o) => {
                        const ps = performanceSummary[o.outcome.id] ?? {};
                        return (
                            <>
                                <th className="center">{ps["Unsatisfactory"] ?? 0}</th>
                                <th className="center">{ps["Developing"] ?? 0}</th>
                                <th className="center">{ps["Satisfactory"] ?? 0}</th>
                                <th className="center">{ps["Exemplary"] ?? 0}</th>
                            </>
                        )
                    })}
                </tr>
            </>
        )
    }, [performanceSummary]);

    const renderTotalByPerformaceRow = useMemo(() => {
        return (
            <>
                <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    {selectedOutcomes.map((o) => {
                        const ps = performanceSummary[o.outcome.id] ?? {};
                        const unsatisfactoryTotal = (ps["Unsatisfactory"] / studentItems.length) * 100;
                        const developingTotal = (ps["Developing"] / studentItems.length) * 100;
                        const satisfactoryTotal = (ps["Satisfactory"] / studentItems.length) * 100;
                        const exemplaryTotal = (ps["Exemplary"] / studentItems.length) * 100;
                        return (
                            <>
                                <th className="center bgDarkGreen tWhite">{unsatisfactoryTotal.toFixed(1)}%</th>
                                <th className="center bgDarkGreen tWhite">{developingTotal.toFixed(1)}%</th>
                                <th className="center bgDarkGreen tWhite">{satisfactoryTotal.toFixed(1)}%</th>
                                <th className="center bgDarkGreen tWhite">{exemplaryTotal.toFixed(1)}%</th>
                            </>
                        )
                    })}
                </tr>
            </>
        )
    }, [performanceSummary]);

    const renderTotalByCriteriaRow = useMemo(() => {
        console.log('TotalByCiteriaRow', performanceSummary);
        return (
            <>
                <tr>
                    <th></th>
                    <th></th>
                    <th className="right bgDarkGray">{"Results(Satisfactory + examplary)"}</th>
                    {selectedOutcomes.map((o) => {
                        const ps = performanceSummary[o.outcome.id] ?? {};
                        const satisfactoryTotal = (ps["Satisfactory"] / studentItems.length) * 100;
                        const exemplaryTotal = (ps["Exemplary"] / studentItems.length) * 100;
                        const total = satisfactoryTotal + exemplaryTotal;
                        return (
                            <>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th className="center bgDarkGreen tWhite">{total.toFixed(1)}%</th>
                            </>
                        )
                    })}
                </tr>
            </>
        )
    }, [performanceSummary]);

    const renderTotalByOutcomeRow = useMemo(() => {
        var total = 0;
        const renderAdjustColumn = Array.from({ length: selectedOutcomes.length-1 }, (_, index) => {
            return (<th></th>);
        });
        return (
            <>
                <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    {selectedOutcomes.map((o) => {
                        const ps = performanceSummary[o.outcome.id] ?? {};
                        const satisfactoryTotal = (ps["Satisfactory"] / studentItems.length) * 100;
                        const exemplaryTotal = (ps["Exemplary"] / studentItems.length) * 100;
                        total += satisfactoryTotal + exemplaryTotal;
                        return (
                            <>
                                <th></th>
                                <th></th>
                                <th></th>
                            </>
                        )
                    })}
                    {renderAdjustColumn}
                    <th className="center bgDarkGreen tWhite">{((total / selectedOutcomes.length) ?? 0).toFixed(1)}%</th>
                </tr>
            </>
        )
    }, [performanceSummary]);

    const renderCourseGoalByOutcomeRow = useMemo(() => {
        return selectedOutcomes.map((o, idx) => {
            const ps = performanceSummary[o.outcome.id] ?? {};
            const satisfactoryTotal = (ps["Satisfactory"] / studentItems.length) * 100;
            const exemplaryTotal = (ps["Exemplary"] / studentItems.length) * 100;
            const total = satisfactoryTotal + exemplaryTotal;

            var colorName = "goalUnsuccess";
            var description = `El criterio ${idx + 1}: No cumplio la meta del curso`;
            if (total >= courseGoal) {
                colorName = "goalSuccess";
                description = `El criterio ${idx + 1}: Si cumplio la meta del curso`;
            }

            return (
                <h5 className={colorName}>
                    {description}
                </h5>
            )
        });
    }, [courseGoal, performanceSummary]);

    const renderOutcomeTable = useMemo(() => {
        return (
            <>
                <thead>
                    {renderOutcomeHeader}
                </thead>
                <tbody>
                    {studentItems.length > 0 &&
                        studentItems.map(function (student, i) {
                            return renderStudentRow(student, i);
                        })
                    }
                    {renderPerformanceSummaryRow}
                    {renderTotalByPerformaceRow}
                    {renderTotalByCriteriaRow}
                    {/*renderTotalByOutcomeRow*/}
                </tbody>
            </>
        )
    }, [selectedOutcomes, performanceSummary]);



    const renderImprovementTable = useMemo(() => {
        return (
            <>
                <thead>
                    <tr>
                        <th></th>
                        {resultsAndImprovementsHeaderRow?.map((hr) =>
                            <th className="center bgDarkGreen tWhite">{hr}</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {resultsAndImprovementsHeaderColumn?.map((hc, idx) => {
                        const rowArrayData = resultsAndImprovementsData[idx] ?? [];
                        const rowInitialData = rowArrayData[0] ?? {};
                        return (
                            <>
                                <tr>
                                    <td className="center bgDarkGray" rowSpan={rowArrayData.length > 0 ? rowArrayData.length : 1}>
                                        {hc}
                                        <br /> <br />
                                        <Button className="btnAdd" onClick={e => handleAddResultsAndImprovements(idx, -1, -1, '')}> + </Button>
                                    </td>
                                    {(rowInitialData && Object.keys(rowInitialData).length > 0) ?
                                        resultsAndImprovementsHeaderRow?.map((hr, idz) => {
                                            return (
                                                <td className="center btnTableAdd bgLightGray" onClick={e => handleModal(idx, 0, idz, rowInitialData[idz] ?? "")}>
                                                    {rowInitialData[idz] ?? ""}
                                                </td>
                                            )
                                        }) :
                                        resultsAndImprovementsHeaderRow?.map((hr, idz) => {
                                            return (
                                                <td className="center btnTableAdd bgLightGray" onClick={e => handleModal(idx, 0, idz, '')}></td>
                                            )
                                        })
                                    }
                                    <td className="center bgLightGray">
                                        <Button className="btnAdd" onClick={e => handleDeleteResultsAndImprovements(idx, 0, -1)}> - </Button>
                                    </td>
                                </tr>
                                {rowArrayData.map((observation, idy) => {
                                    if (idy < 1) return;
                                    return (
                                        <tr>
                                            {resultsAndImprovementsHeaderRow?.map((hr, idz) => {
                                                return (
                                                    <td className="center btnTableAdd bgLightGray" onClick={e => handleModal(idx, idy, idz, observation[idz] ?? "")}>
                                                        {observation[idz] ?? ""}
                                                    </td>
                                                )
                                            })}
                                            <td className="center bgLightGray">
                                                <Button className="btnAdd" onClick={e => handleDeleteResultsAndImprovements(idx, idy, -1)}> - </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </>
                        )
                    })}
                </tbody>
            </>
        );
    }, [selectedOutcomes, performanceSummary, resultsAndImprovementsData]);

    return (
        <React.Fragment>
            <Modal isOpen={modal} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>{resultsAndImprovementsHeaderRow[ri[2]]}</ModalHeader>
                <ModalBody>
                    {resultsAndImprovementsHeaderColumn[ri[0]]}
                    <br />
                    <br />
                    <Input value={modalText} onChange={(e) => setModalText(e.target.value)} />
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleModal}>
                        Cancel
                    </Button>{' '}
                    <Button color="primary" onClick={handleModalSubmit}>
                        Guardar
                    </Button>
                </ModalFooter>
            </Modal>

            <div>
                <div>
                    <Row>
                        <Col xs="9">
                            <h1>Mediciones - Student Outcomes</h1>
                        </Col>
                        <Col xs="3" style={{ "textAlign": "right", "alignSelf": "center" }}>
                            {!isSyncRM ? (
                                <Button onClick={syncRM} color="primary">Sincronizar</Button>
                            ) : (
                                <Spinner>
                                    Sincronizando...
                                </Spinner>
                            )}
                        </Col>
                    </Row>
                </div>
                <p style={{ "fontSize": "1.25rem" }}>Visualización de la medición de los Student Outcomes por cada criterio.</p>
                {outcomesRM?.length > 0 &&
                    <p>Nota: En este semestre tiene {outcomesRM.length} resultado(s) de aprendizaje por medir.</p>
                }
                <br />
                <div>
                    <Row>
                        <Col xs="3" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>Student Outcomes: </span>
                        </Col>
                        <Col xs="9">
                            <Select
                                value={selectedOutcomeRM}
                                onChange={setSelectedOutcomeRM}
                                options={selectorOutcomesRM}
                                style={{maxWidth: "400px"}}
                            />
                        </Col>
                    </Row>
                    <Row className="mt-10 mb-10">
                        <Col xs="3" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>Medición: </span>
                        </Col>
                        <Col xs="9" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>{getTypeRM()}</span>
                        </Col>
                    </Row>
                    <Row className="mt-10 mb-10">
                        <Col xs="3" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>Meta Curso: </span>
                        </Col>
                        <Col xs="9" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            {/*<Input
                                value={courseGoal}
                                onChange={handleCourseGoal}
                                onKeyPress={(event) => {
                                    if (!/[0-9]/.test(event.key)) {
                                        event.preventDefault();
                                    }
                                }}
                                style={{ width: "100px" }}
                            />*/}
                            <span>{courseGoal}%</span>
                        </Col>
                    </Row>
                    <Row className="mt-10 mb-10">
                        <Col xs="3" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>Visualización: </span>
                        </Col>
                        <Col xs="9" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <Button
                                onClick={() => setIsTabulationAndGraphs(!isTabulationAndGraphs)}
                                color={isTabulationAndGraphs ? "dark" : "light"}>
                                Tabulación y<br/>Gráfica
                            </Button>
                            <Button
                                onClick={() => setIsResultsAndImprovements(!isResultsAndImprovements)}
                                color={isResultsAndImprovements ? "dark" : "light"}
                                style={{ marginLeft: "10px" }}
                            >
                                Análisis y<br />Mejoras
                            </Button>
                        </Col>
                    </Row>
                    <Row className="mt-10 mb-10">
                        <Col xs="3" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>Acciones: </span>
                        </Col>
                        <Col xs="2" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <Button onClick={handlePrint}>
                                Exportar PDF
                            </Button>
                        </Col>
                    </Row>                    
                </div>
            </div>
            <br />
            <OutcomeToPrint
                ref={componentRef}
                tabulationAndGraphsTable={renderOutcomeTable}
                resultsAndImprovementsTable={renderImprovementTable}
                renderCourseGoalByOutcomeRow={renderCourseGoalByOutcomeRow}
                chartData={chartData}
                isTabulationAndGraphs={isTabulationAndGraphs}
                isResultsAndImprovements={isResultsAndImprovements}
            />
        </React.Fragment>
    );
};

export default Foo;