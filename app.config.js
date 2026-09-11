import 'dotenv/config';

export default ({ config }) => {
    return {
        ...config,
        extra: {
            eas: {
                projectId: "558bfea9-b275-4b59-8099-3ef01956b1ba",
            },
        },
    };
};
