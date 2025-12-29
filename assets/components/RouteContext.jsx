import React, { createContext, useContext } from 'react';

const RouteContext = createContext({});

export const RouteProvider = ({ children, routes }) => {
    return (
        <RouteContext.Provider value={routes}>
            {children}
        </RouteContext.Provider>
    );
};

export const useRoutes = () => {
    return useContext(RouteContext);
};
