import logging
from sympy import symbols, exp, integrate, simplify
import json
import sys

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("compute_numerators.log"),  # Logs to a file
        logging.StreamHandler(sys.stderr)  # Logs to stderr to prevent interference with JSON output
    ]
)

def calculate_numerator(params):
    logging.debug("Starting numerator calculation...")
    try:
        # Define symbolic variable
        t = symbols('t')

        # Convert parameters from Unix timestamps to hours
        t0 = params['t0'] / 3600  # Convert Unix time to hours
        t1 = params['t1'] / 3600
        D = params['D'] / 3600
        Tmax = params['Tmax']
        k = params['k']
        mu_due = params['muDueTimes'] / 3600
        sigma_due = params['sigmaDueTimes'] / 3600
        mu_logged = params['muLoggedTimes'] / 3600
        sigma_logged = params['sigmaLoggedTimes'] / 3600
        logged_time = params['loggedTime'] / 3600

        # Log scaled parameters
        logging.debug(f"Scaled parameters (in hours): t0={t0}, t1={t1}, D={D}, Tmax={Tmax}, k={k}")
        logging.debug(f"mu_due={mu_due}, sigma_due={sigma_due}, mu_logged={mu_logged}, sigma_logged={sigma_logged}, logged_time={logged_time}")

        # Formula components
        exp_term = (1 - exp(-k * (Tmax - (D - t)) / Tmax)) / (1 - exp(-k))
        logging.debug(f"Exponential term: {exp_term}")

        due_component = (0.5 + 0.5 * exp_term) * ((D - t) - mu_due) / sigma_due
        logging.debug(f"Due times component: {due_component}")

        logged_component = (0.5 - 0.5 * exp_term) * (logged_time - mu_logged) / sigma_logged
        logging.debug(f"Logged times component: {logged_component}")

        numerator_integrand = due_component + logged_component
        logging.debug(f"Numerator integrand: {numerator_integrand}")

        # Integration
        try:
            logging.debug("Starting symbolic integration of numerator integrand...")
            numerator = integrate(numerator_integrand, (t, t0, t1))
            logging.debug(f"Integrated numerator (symbolic): {numerator}")
        except Exception as e:
            logging.error("Error during integration", exc_info=True)
            raise e

        # Simplification
        try:
            logging.debug("Starting simplification of numerator...")
            simplified_numerator = simplify(numerator)
            logging.debug(f"Simplified numerator: {simplified_numerator}")
        except Exception as e:
            logging.error("Error during simplification", exc_info=True)
            raise e

        return str(simplified_numerator)

    except Exception as e:
        logging.error("Error during numerator calculation", exc_info=True)
        raise e

if __name__ == "__main__":
    logging.info("Script started...")

    # Determine input source (file or stdin)
    try:
        if len(sys.argv) > 1:
            input_arg = sys.argv[1]
            try:
                # Try to parse input as JSON directly
                params = json.loads(input_arg)
                logging.info("Reading input parameters from command-line argument.")
            except json.JSONDecodeError:
                # Otherwise, treat it as a file path
                input_file = input_arg
                logging.info(f"Reading input parameters from file: {input_file}")
                with open(input_file, 'r') as f:
                    params = json.load(f)
        else:
            logging.info("Reading input parameters from stdin")
            params = json.loads(sys.stdin.read())

        # Validate input parameters
        required_keys = [
            't0', 't1', 'D', 'Tmax', 'k',
            'muDueTimes', 'sigmaDueTimes',
            'muLoggedTimes', 'sigmaLoggedTimes', 'loggedTime'
        ]
        for key in required_keys:
            if key not in params:
                logging.error(f"Missing required parameter: {key}")
                raise ValueError(f"Missing required parameter: {key}")

        # Perform the numerator calculation
        numerator = calculate_numerator(params)
        logging.info(f"Numerator calculation successful: {numerator}")

        # Output the result
        print(json.dumps({"numerator": numerator}))  # Only JSON is printed to stdout
        logging.info("Result successfully written to stdout.")

    except Exception as e:
        logging.error("Fatal error in script execution", exc_info=True)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)