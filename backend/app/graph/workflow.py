from langgraph.graph import END, START, StateGraph

from app.agents.manager import manager_agent
from app.graph.state import CodeForgeState


def build_graph():
    graph = StateGraph(CodeForgeState)

    graph.add_node("manager", manager_agent)

    graph.add_edge(START, "manager")
    graph.add_edge("manager", END)

    return graph.compile()

