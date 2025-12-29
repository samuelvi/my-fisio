import Routing, { RoutingData } from './Routing';
import routes from './routes.json';

Routing.setRoutingData(routes as unknown as RoutingData);

export default Routing;