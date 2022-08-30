import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useReactToPrint } from "react-to-print";

import { Container, Row, Col, Button, Spinner } from 'reactstrap';

import { Home } from './Home';

const Foo = () => {
    const componentRef = useRef(null);

    const location = useLocation();
    const params = new URLSearchParams(location.search);

    const routesAPIUrl = 'https://localhost:44324/api';
    const canvasAPIUrl = 'https://testcanvas.espol.edu.ec/api/v1';

    const headers = new Headers({
        'Authorization': 'Bearer eh6ADTeUhYpH8rhV6JWCSZWsNz8ZTq5oJzwSxE2ckXi8H7yaCGNwjZXfjPolY9fE',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Content-Type': 'application/json'
    });
    const userId = params.get('user_id');
    const courseId = params.get('course_id');

    const performance = ["Unsatisfactory", "Developing", "Satisfactory", "Exemplary"];


    //const [error, setError] = useState(null);

    // CanvasLMS
    const [isStudentsLoaded, setStudentsIsLoaded] = useState(false);
    const [studentItems, setStudentItems] = useState([]);

    //const [teachers, setTeachers] = useState([]);
    const [course, setCourse] = useState({});
    const [assignedOutcomeGroups, setAssignedOutcomeGroups] = useState([]);
    const [selectedOutcomeGroup, setSelectedOutcomeGroup] = useState({});
    const [allOutcomes, setAllOutcomes] = useState({});
    const [selectedOutcomes, setSelectedOutcomes] = useState([]);

    // Rutas Mediciones
    const [isSyncRM, setIsSyncRM] = useState(false);
    const [outcomesRM, setOutcomesRM] = useState([]);
    const [selectorOutcomesRM, setSelectorOutcomesRM] = useState([]);
    const [selectedOutcomeRM, setSelectedOutcomeRM] = useState({});

    useEffect(() => {
        //fetchTeachers();
        fetchCourse();
        fetchStudents();
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
        if (selectedOutcomeGroup &&
            Object.keys(selectedOutcomeGroup).length > 0 &&
            Object.keys(allOutcomes).length === assignedOutcomeGroups.length) {
            setSelectedOutcomes(allOutcomes[selectedOutcomeGroup.id]);
        }
    }, [selectedOutcomeGroup, allOutcomes]);


    // Print PDF
    const reactToPrintContent = useCallback(() => {
        return componentRef.current;
    }, [componentRef.current]);

    const handlePrint = useReactToPrint({
        content: reactToPrintContent,
        documentTitle: "AwesomeFileName",
        removeAfterPrint: true
    });


    const getTypeRM = useCallback(() => {
        const currentRM = outcomesRM.filter((o) => {
            if (o.id === selectedOutcomeRM.value) return o;
        })[0];
        return currentRM?.type ?? "N/A";
    }, [selectedOutcomeRM]);


    const performanceColumns = useMemo(() => {
        return performance?.map(p => <th>{p}</th>)
    }, [performance]);

    const getOutcomeHeader = useMemo(() => {
        if (selectedOutcomes?.length > 0) {
            const outcomeHeaders = selectedOutcomes?.map(o => <th colSpan={performance?.length ?? 1}>{o?.outcome.title}</th>);
            const performanceHeaders = selectedOutcomes?.map(o => performanceColumns);
            return (
                <>
                    <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        {outcomeHeaders}
                    </tr>
                    <tr>
                        <th>Nº</th>
                        <th>Id</th>
                        <th>Student Name</th>
                        {performanceHeaders}
                    </tr>
                </>
            );
        }
        return <></>;
    }, [selectedOutcomes]);

    const renderStudentRow = (student, key) => {
        return (
            <tr>
                <td>{key + 1}</td>
                <td>{student.sis_user_id}</td>
                <td>{student.name}</td>
                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>

                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>

                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>
                <td>{Math.round(Math.random())}</td>
            </tr>
        );
    }

    const getOutcomeTable = useMemo(() => {
        return (
            <>
                <table className='table table-striped' aria-labelledby="tabelLabel">
                    <thead>
                        {getOutcomeHeader}
                    </thead>
                    <tbody>
                        {studentItems.length > 0 &&
                            studentItems.map(function (student, i) {
                                return renderStudentRow(student, i);
                            })
                        }
                    </tbody>
                </table>
            </>
        )
    }, [selectedOutcomes]);

    const showMessage = (body) => toast(body);

    const fetchCourse = async () => {
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}`, {
            headers: headers
        })
            .then(res => res.json())
            .then(
                (result) => {
                    result['sis_course_id'] = 131108;
                    setCourse(result);
                },
                (error) => {
                    setCourse({});
                    showMessage(error);
                }
            )

    }

    // RutasMediciones - List Outcomes by Course
    const fetchOutcomesRM = async () => {
        const response = await fetch(`${routesAPIUrl}/routes/${course?.sis_course_id}`, {
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
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}/users/?enrollment_type=student`, {
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

    // CanvasLMS - List Outcome Groups (List Outcomes)
    const fetchAssignedOutcomeGroups = async () => {
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_groups/?outcome_style=full`, {
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
    const fetchOutcomes = async (outcomeId) => {
        const response = await fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_groups/${outcomeId}/outcomes/`, {
            headers: headers
        })
            .then(res => res.json())
            .then(
                (result) => {
                    const data = {};
                    data[outcomeId] = result;
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
            const respOutcomeGroups = await fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_groups/?outcome_style=full`, {
                headers: headers
            });
            const outcomeGroups = await respOutcomeGroups.json();
            const parentOutcomeGroup = outcomeGroups[0];

            // Fetch outcomes from routes system
            const respOutcomesRM = await fetch(`${routesAPIUrl}/routes/${course?.sis_course_id}`);
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
                        body: JSON.stringify({ title: outcomeRM.title, vendor_guid: outcomeRM.id })
                    };
                    fetch(`${canvasAPIUrl}/courses/${courseId}/outcome_groups/${parentOutcomeGroup.id}/subgroups/`, requestOptions);
                }
            });
        } catch (e) { console.log(e) }

        // Ending
        setIsSyncRM(false);
        showMessage("Se ha sincronizado los SO correctamente!");
    }

    return (
        <React.Fragment>
            <div style={{
                "position": "sticky", "top": 0, "backgroundColor": "white", "paddingTop": 24, "paddingBottom": 24, "paddingRight": 15, "paddingLeft": 15}}>
                <div>
                    <Row>
                        <Col xs="9">
                            <h1>Mediciones - Resultados de Aprendizaje</h1>
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
                <p style={{ "fontSize": "1.25rem" }}>Visualización de la medición de los resultados de aprendizaje por cada criterio.</p>
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
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs="3" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>Medición: </span>
                        </Col>
                        <Col xs="9" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>{getTypeRM()}</span>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs="3" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <span>Acciones: </span>
                        </Col>
                        <Col xs="9" style={{ "textAlign": "left", "alignSelf": "center" }}>
                            <Button onClick={handlePrint}>
                                Exportar PDF
                            </Button>
                        </Col>
                    </Row>
                </div>
            </div>
            <br />

            <Home ref={componentRef} children={getOutcomeTable} />            
        </React.Fragment>
    );
};

export default Foo;