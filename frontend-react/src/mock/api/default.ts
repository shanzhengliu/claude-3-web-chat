import Mock from "mockjs"

export const mockDefault = () => {
    Mock.mock(import.meta.env.VITE_BACKEND_URL, "get", {"data":"hello world"})
}